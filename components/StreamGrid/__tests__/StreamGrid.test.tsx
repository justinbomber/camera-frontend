import { render, screen, fireEvent } from '@testing-library/react'
import StreamGrid from '../index'

// Mock StreamCell component
jest.mock('../../StreamCell', () => {
  return function MockStreamCell({ index, onClick }: any) {
    return (
      <div data-testid={`stream-cell-${index}`} onClick={onClick}>
        Mock Stream Cell {index}
      </div>
    )
  }
})

describe('StreamGrid', () => {
  const mockOnCellClick = jest.fn()
  const defaultProps = {
    streams: ['stream1', 'stream2', 'stream3'],
    isRemoveMode: false,
    onCellClick: mockOnCellClick
  }

  beforeEach(() => {
    mockOnCellClick.mockClear()
  })

  it('renders correct number of stream cells', () => {
    render(<StreamGrid {...defaultProps} />)
    const cells = screen.getAllByTestId(/stream-cell-/)
    expect(cells).toHaveLength(9) // Default grid is 9 cells (3x3)
  })

  it('renders empty cells to fill grid', () => {
    render(<StreamGrid {...defaultProps} />)
    // 3 streams + 6 empty cells = 9 total cells
    expect(screen.getAllByTestId(/stream-cell-/)).toHaveLength(9)
  })

  it('handles cell click in remove mode', () => {
    render(<StreamGrid {...defaultProps} isRemoveMode={true} />)
    fireEvent.click(screen.getByTestId('stream-cell-0'))
    expect(mockOnCellClick).toHaveBeenCalledWith(0)
  })

  it('does not handle cell click when not in remove mode', () => {
    render(<StreamGrid {...defaultProps} />)
    fireEvent.click(screen.getByTestId('stream-cell-0'))
    expect(mockOnCellClick).not.toHaveBeenCalled()
  })

  it('respects custom grid layout', () => {
    render(<StreamGrid {...defaultProps} gridLayout={4} />)
    expect(screen.getAllByTestId(/stream-cell-/)).toHaveLength(4)
  })

  it('marks selected cells correctly', () => {
    render(
      <StreamGrid
        {...defaultProps}
        isRemoveMode={true}
        selectedIndices={[0, 2]}
      />
    )
    const cell0 = screen.getByTestId('stream-cell-0')
    const cell2 = screen.getByTestId('stream-cell-2')
    expect(cell0).toHaveAttribute('data-selected', 'true')
    expect(cell2).toHaveAttribute('data-selected', 'true')
  })
}) 