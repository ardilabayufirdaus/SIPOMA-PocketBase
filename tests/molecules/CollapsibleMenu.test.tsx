import { render, screen, fireEvent } from '@testing-library/react';
import CollapsibleMenu from '../../components/molecules/CollapsibleMenu';

describe('CollapsibleMenu', () => {
  const defaultProps = {
    icon: <span>Icon</span>,
    label: 'Menu',
    isActive: true,
    pages: [
      { key: 'page1', icon: <span>Page1Icon</span> },
      { key: 'page2', icon: <span>Page2Icon</span> },
    ],
    activeSubPage: 'page1',
    onSelect: jest.fn(),
    t: {},
    isCollapsed: false,
  };

  it('renders label and pages', () => {
    render(<CollapsibleMenu {...defaultProps} />);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Page1Icon')).toBeInTheDocument();
    expect(screen.getByText('Page2Icon')).toBeInTheDocument();
  });

  it('calls onSelect when page clicked', () => {
    render(<CollapsibleMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('Page1Icon'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('page1');
  });
});
