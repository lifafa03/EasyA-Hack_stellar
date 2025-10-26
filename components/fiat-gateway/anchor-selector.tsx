'use client';

import * as React from 'react';
import { AnchorRegistry, type AnchorProvider } from '@/lib/stellar/services/anchor-registry';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Info, Check } from 'lucide-react';

interface AnchorSelectorProps {
  onSelect: (anchor: AnchorProvider) => void;
  selectedAnchorId?: string;
  userId?: string;
}

export function AnchorSelector({
  onSelect,
  selectedAnchorId,
  userId = 'default',
}: AnchorSelectorProps) {
  const [anchors, setAnchors] = React.useState<AnchorProvider[]>([]);
  const [filteredAnchors, setFilteredAnchors] = React.useState<AnchorProvider[]>([]);
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('all');
  const [selectedRegion, setSelectedRegion] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [detailsAnchor, setDetailsAnchor] = React.useState<AnchorProvider | null>(null);
  const [rememberChoice, setRememberChoice] = React.useState(false);

  // Load anchors and check for preferred anchor
  React.useEffect(() => {
    const allAnchors = AnchorRegistry.getAvailableAnchors();
    setAnchors(allAnchors);
    setFilteredAnchors(allAnchors);

    // Check if there's a preferred anchor
    const preferred = AnchorRegistry.getPreferredAnchor(userId);
    if (preferred) {
      setRememberChoice(true);
    }
  }, [userId]);

  // Filter anchors based on currency and region
  React.useEffect(() => {
    let filtered = [...anchors];

    if (selectedCurrency !== 'all') {
      filtered = filtered.filter((anchor) =>
        anchor.supportedCurrencies.includes(selectedCurrency)
      );
    }

    if (selectedRegion !== 'all') {
      filtered = filtered.filter((anchor) =>
        anchor.supportedRegions.includes(selectedRegion) ||
        anchor.supportedRegions.includes('GLOBAL')
      );
    }

    setFilteredAnchors(filtered);
  }, [selectedCurrency, selectedRegion, anchors]);

  const handleSelectAnchor = (anchor: AnchorProvider) => {
    if (rememberChoice) {
      AnchorRegistry.setPreferredAnchor(userId, anchor.id);
    }
    onSelect(anchor);
  };

  const allCurrencies = AnchorRegistry.getAllSupportedCurrencies();
  const allRegions = AnchorRegistry.getAllSupportedRegions();

  return (
    <div className="space-y-6" role="region" aria-label="Anchor provider selection">
      {/* Header and Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold" id="anchor-selector-title">Select an Anchor Provider</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Choose a trusted anchor to convert between fiat and cryptocurrency
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4" role="search" aria-label="Filter anchor providers">
          <div className="flex-1">
            <Label htmlFor="currency-filter">Filter by Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger id="currency-filter" aria-label="Filter anchors by currency">
                <SelectValue placeholder="All currencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {allCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="region-filter">Filter by Region</Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger id="region-filter" aria-label="Filter anchors by region">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {allRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              aria-label={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
              aria-pressed={viewMode === 'table'}
            >
              {viewMode === 'grid' ? 'Table View' : 'Grid View'}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-choice"
            checked={rememberChoice}
            onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
            aria-describedby="remember-choice-description"
          />
          <Label
            htmlFor="remember-choice"
            className="text-sm font-normal cursor-pointer"
          >
            Remember my choice for future transactions
          </Label>
          <span id="remember-choice-description" className="sr-only">
            When enabled, your selected anchor will be automatically used for future transactions
          </span>
        </div>
      </div>

      {/* No Results Message */}
      {filteredAnchors.length === 0 && (
        <Card role="status" aria-live="polite">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No anchors available for the selected filters. Try adjusting your currency or region selection.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredAnchors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Available anchor providers">
          {filteredAnchors.map((anchor) => (
            <Card
              key={anchor.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAnchorId === anchor.id ? 'ring-2 ring-primary' : ''
              }`}
              role="listitem"
              aria-label={`${anchor.name} anchor provider${selectedAnchorId === anchor.id ? ' - Currently selected' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {anchor.name}
                      {selectedAnchorId === anchor.id && (
                        <Check className="h-4 w-4 text-primary" aria-label="Selected" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {anchor.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsAnchor(anchor);
                    }}
                    aria-label={`View details for ${anchor.name}`}
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit Fee:</span>
                    <span className="font-medium" aria-label={`Deposit fee: ${anchor.fees.deposit}`}>{anchor.fees.deposit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Withdrawal Fee:</span>
                    <span className="font-medium" aria-label={`Withdrawal fee: ${anchor.fees.withdrawal}`}>{anchor.fees.withdrawal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit Time:</span>
                    <span className="font-medium" aria-label={`Deposit processing time: ${anchor.processingTime.deposit}`}>{anchor.processingTime.deposit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Supported Currencies:</p>
                  <div className="flex flex-wrap gap-1" role="list" aria-label="Supported currencies">
                    {anchor.supportedCurrencies.slice(0, 4).map((currency) => (
                      <Badge key={currency} variant="secondary" role="listitem">
                        {currency}
                      </Badge>
                    ))}
                    {anchor.supportedCurrencies.length > 4 && (
                      <Badge variant="outline" role="listitem" aria-label={`${anchor.supportedCurrencies.length - 4} more currencies`}>
                        +{anchor.supportedCurrencies.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleSelectAnchor(anchor)}
                  aria-label={`Select ${anchor.name} as your anchor provider`}
                >
                  Select {anchor.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredAnchors.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table aria-label="Anchor providers comparison table">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Provider</TableHead>
                  <TableHead scope="col">Deposit Fee</TableHead>
                  <TableHead scope="col">Withdrawal Fee</TableHead>
                  <TableHead scope="col">Deposit Time</TableHead>
                  <TableHead scope="col">Withdrawal Time</TableHead>
                  <TableHead scope="col">Currencies</TableHead>
                  <TableHead scope="col" className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnchors.map((anchor) => (
                  <TableRow
                    key={anchor.id}
                    className={selectedAnchorId === anchor.id ? 'bg-muted/50' : ''}
                    aria-selected={selectedAnchorId === anchor.id}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {anchor.name}
                        {selectedAnchorId === anchor.id && (
                          <Check className="h-4 w-4 text-primary" aria-label="Selected" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{anchor.fees.deposit}</TableCell>
                    <TableCell>{anchor.fees.withdrawal}</TableCell>
                    <TableCell>{anchor.processingTime.deposit}</TableCell>
                    <TableCell>{anchor.processingTime.withdrawal}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1" role="list" aria-label={`${anchor.name} supported currencies`}>
                        {anchor.supportedCurrencies.slice(0, 3).map((currency) => (
                          <Badge key={currency} variant="secondary" className="text-xs" role="listitem">
                            {currency}
                          </Badge>
                        ))}
                        {anchor.supportedCurrencies.length > 3 && (
                          <Badge variant="outline" className="text-xs" role="listitem" aria-label={`${anchor.supportedCurrencies.length - 3} more currencies`}>
                            +{anchor.supportedCurrencies.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDetailsAnchor(anchor)}
                          aria-label={`View details for ${anchor.name}`}
                        >
                          <Info className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSelectAnchor(anchor)}
                          aria-label={`Select ${anchor.name} as your anchor provider`}
                        >
                          Select
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={!!detailsAnchor} onOpenChange={() => setDetailsAnchor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailsAnchor?.name}</DialogTitle>
            <DialogDescription>{detailsAnchor?.description}</DialogDescription>
          </DialogHeader>

          {detailsAnchor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Fees</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit:</span>
                      <span>{detailsAnchor.fees.deposit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Withdrawal:</span>
                      <span>{detailsAnchor.fees.withdrawal}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Processing Times</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit:</span>
                      <span>{detailsAnchor.processingTime.deposit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Withdrawal:</span>
                      <span>{detailsAnchor.processingTime.withdrawal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Supported Currencies</h4>
                <div className="flex flex-wrap gap-2">
                  {detailsAnchor.supportedCurrencies.map((currency) => (
                    <Badge key={currency} variant="secondary">
                      {currency}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Supported Regions</h4>
                <div className="flex flex-wrap gap-2">
                  {detailsAnchor.supportedRegions.map((region) => (
                    <Badge key={region} variant="outline">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Technical Details</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-mono text-xs">{detailsAnchor.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider ID:</span>
                    <span className="font-mono text-xs">{detailsAnchor.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailsAnchor(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleSelectAnchor(detailsAnchor);
                    setDetailsAnchor(null);
                  }}
                >
                  Select {detailsAnchor.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
