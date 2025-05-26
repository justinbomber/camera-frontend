import { render, screen, fireEvent } from '@testing-library/react'
import ControlPanel from '../index'

describe('ControlPanel', () => {
  const mockSetIsOpen = jest.fn()
  const defaultProps = {
    isOpen: true,
    setIsOpen: mockSetIsOpen,
    children: <div>Test Content</div>
  }

  beforeEach(() => {
    mockSetIsOpen.mockClear()
  })

  it('renders children when open', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders title when open', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByText('Control Panel')).toBeInTheDocument()
  })

  it('closes on close button click', () => {
    render(<ControlPanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetIsOpen).toHaveBeenCalledWith(false)
  })

  it('closes on ESC key press', () => {
    render(<ControlPanel {...defaultProps} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockSetIsOpen).toHaveBeenCalledWith(false)
  })

  it('shows overlay in mobile mode', () => {
    render(<ControlPanel {...defaultProps} isMobile />)
    const overlay = screen.getByRole('generic', { hidden: true })
    expect(overlay).toHaveClass('overlay')
  })

  it('closes on overlay click in mobile mode', () => {
    render(<ControlPanel {...defaultProps} isMobile />)
    const overlay = screen.getByRole('generic', { hidden: true })
    fireEvent.click(overlay)
    expect(mockSetIsOpen).toHaveBeenCalledWith(false)
  })

  it('does not render content when closed', () => {
    render(<ControlPanel {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })
}) 