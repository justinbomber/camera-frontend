import { render, screen, fireEvent } from '@testing-library/react'
import AddStreamDialog from '../index'

describe('AddStreamDialog', () => {
  const mockOnClose = jest.fn()
  const mockOnAdd = jest.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onAdd: mockOnAdd
  }

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnAdd.mockClear()
  })

  it('renders dialog when open', () => {
    render(<AddStreamDialog {...defaultProps} />)
    expect(screen.getByText('Add New Stream')).toBeInTheDocument()
  })

  it('shows error for empty URL', () => {
    render(<AddStreamDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Add Stream'))
    expect(screen.getByText('Please enter a valid stream URL')).toBeInTheDocument()
  })

  it('shows error for invalid URL', () => {
    render(<AddStreamDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText('http://example.com/stream')
    fireEvent.change(input, { target: { value: 'invalid-url' } })
    fireEvent.click(screen.getByText('Add Stream'))
    expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
  })

  it('calls onAdd with valid URL', () => {
    mockOnAdd.mockReturnValue(true)
    render(<AddStreamDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText('http://example.com/stream')
    fireEvent.change(input, { target: { value: 'http://valid-url.com' } })
    fireEvent.click(screen.getByText('Add Stream'))
    expect(mockOnAdd).toHaveBeenCalledWith('http://valid-url.com')
  })

  it('closes dialog on successful add', () => {
    mockOnAdd.mockReturnValue(true)
    render(<AddStreamDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText('http://example.com/stream')
    fireEvent.change(input, { target: { value: 'http://valid-url.com' } })
    fireEvent.click(screen.getByText('Add Stream'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows error when no empty cells available', () => {
    mockOnAdd.mockReturnValue(false)
    render(<AddStreamDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText('http://example.com/stream')
    fireEvent.change(input, { target: { value: 'http://valid-url.com' } })
    fireEvent.click(screen.getByText('Add Stream'))
    expect(screen.getByText('No empty cells available. Please remove a stream first.')).toBeInTheDocument()
  })
}) 