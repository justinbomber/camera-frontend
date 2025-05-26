import { render } from '@testing-library/react'
import H265Player from '../index'

// Mock window.H265webjs
const mockDestroy = jest.fn()
const mockH265webjs = jest.fn(() => ({
  destroy: mockDestroy
}))

describe('H265Player', () => {
  beforeAll(() => {
    // @ts-ignore
    window.H265webjs = mockH265webjs
  })

  beforeEach(() => {
    mockH265webjs.mockClear()
    mockDestroy.mockClear()
  })

  it('renders without crashing', () => {
    render(<H265Player videoUrl="test-url" />)
    expect(mockH265webjs).toHaveBeenCalledWith('test-url', expect.any(Object))
  })

  it('cleans up on unmount', () => {
    const { unmount } = render(<H265Player videoUrl="test-url" />)
    unmount()
    expect(mockDestroy).toHaveBeenCalled()
  })

  it('reinitializes player when props change', () => {
    const { rerender } = render(<H265Player videoUrl="test-url" />)
    expect(mockH265webjs).toHaveBeenCalledTimes(1)

    rerender(<H265Player videoUrl="new-url" />)
    expect(mockDestroy).toHaveBeenCalled()
    expect(mockH265webjs).toHaveBeenCalledTimes(2)
  })
}) 