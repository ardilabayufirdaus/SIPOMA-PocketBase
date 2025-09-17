import { render, screen } from '@testing-library/react';
import Button from '../../components/atoms/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    render(<Button className="test-class">Test</Button>);
    expect(screen.getByText('Test')).toHaveClass('test-class');
  });
});
