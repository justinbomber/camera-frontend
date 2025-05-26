import { render, screen, fireEvent } from '@testing-library/react'
import StreamCell from '../index'

// Mock StreamService
jest.mock('@/lib/streamService', () => {
  return class MockStreamService {
    initializeStream = jest.fn()
    destroy = jest.fn()
  }
})

describe('StreamCell', () => {
  const defaultProps = {
    index: 0,
    streamUrl: null,
    isRemoveMode: false,
    onClick: jest.fn(),
  }

  it('renders empty state when no stream URL is provided', () => {
    render(<StreamCell {...defaultProps} />)
    expect(screen.getByText('No Stream')).toBeInTheDocument()
  })

  it('renders stream title when URL is provided', () => {
    render(<StreamCell {...defaultProps} streamUrl="http://example.com/stream" />)
    expect(screen.getByText('Stream 1')).toBeInTheDocument()
  })

  it('shows remove mode overlay when isRemoveMode is true', () => {
    render(
      <StreamCell
        {...defaultProps}
        streamUrl="http://example.com/stream"
        isRemoveMode={true}
        isSelected={false}
      />
    )
    expect(screen.getByRole('img', { name: /x circle/i })).toBeInTheDocument()
  })

  it('shows check icon when selected in remove mode', () => {
    render(
      <StreamCell
        {...defaultProps}
        streamUrl="http://example.com/stream"
        isRemoveMode={true}
        isSelected={true}
      />
    )
    expect(screen.getByRole('img', { name: /check/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<StreamCell {...defaultProps} onClick={onClick} />)
    fireEvent.click(screen.getByRole('article'))
    expect(onClick).toHaveBeenCalled()
  })
}) 