import { render, screen } from '@testing-library/react';
import Badge from '../../components/atoms/Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    render(<Badge className="badge-test">Badge</Badge>);
    expect(screen.getByText('Badge')).toHaveClass('badge-test');
  });
});
