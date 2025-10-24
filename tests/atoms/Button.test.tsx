import { render, screen } from '@testing-library/react';
import Button from '../../components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    render(<Button className="test-class">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-class');
    expect(button).toHaveClass('inline-flex'); // Base classes still applied
  });

  it('applies different variants', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toBeInTheDocument();
  });

  it('applies different sizes', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByText('Large');
    expect(button).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
