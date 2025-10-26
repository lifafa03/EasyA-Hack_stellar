import { render, screen, waitFor } from '@testing-library/react'
import { ExchangeRateDisplay } from '../exchange-rate-display'
import { ExchangeRate } from '@/lib/stellar/services/anchor'

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ExchangeRateDisplay', () => {
  const mockRate: ExchangeRate = {
    from: 'USD',
    to: 'USDC',
    rate: '0.9950',
    fee: '0.0050',
    timestamp: Date.now() / 1000,
  }

  it('displays exchange rate information', () => {
    render(<ExchangeRateDisplay rate={mockRate} />)
    
    expect(screen.getByText('Exchange Rate')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('0.9950')).toBeInTheDocument()
  })

  it('displays fee breakdown', () => {
    render(<ExchangeRateDisplay rate={mockRate} />)
    
    expect(screen.getByText('Exchange Fee')).toBeInTheDocument()
    expect(screen.getByText(/0.0050/)).toBeInTheDocument()
  })

  it('displays loading state', () => {
    render(<ExchangeRateDisplay rate={mockRate} loading={true} />)
    
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays error state', () => {
    const errorMessage = 'Failed to fetch rate'
    render(<ExchangeRateDisplay rate={mockRate} error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('calls onRefresh when auto-refresh is enabled', async () => {
    const mockRefresh = jest.fn().mockResolvedValue(undefined)
    
    render(
      <ExchangeRateDisplay 
        rate={mockRate} 
        onRefresh={mockRefresh}
        autoRefresh={true}
        refreshInterval={100}
      />
    )
    
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    }, { timeout: 200 })
  })

  it('displays auto-refresh badge when enabled', () => {
    render(
      <ExchangeRateDisplay 
        rate={mockRate} 
        autoRefresh={true}
      />
    )
    
    expect(screen.getByText('Auto-refresh')).toBeInTheDocument()
  })

  it('displays last updated timestamp', () => {
    render(<ExchangeRateDisplay rate={mockRate} />)
    
    expect(screen.getByText(/Just now|ago/)).toBeInTheDocument()
  })
})
