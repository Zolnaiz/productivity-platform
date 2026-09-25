import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Input from './Input';
import Select from './Select';

describe('Input', () => {
  it('keeps the label wired to the field across re-renders', () => {
    const { rerender } = render(<Input label="Project name" defaultValue="" />);

    const field = screen.getByLabelText('Project name');
    const firstId = field.id;
    expect(firstId).toBeTruthy();

    // A regenerated id on every render would silently break the label link.
    rerender(<Input label="Project name" defaultValue="changed" />);

    expect(screen.getByLabelText('Project name').id).toBe(firstId);
  });

  it('gives each field its own id', () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>,
    );

    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });

  it('announces an error and links it to the field', () => {
    render(<Input label="Email" error="Enter a valid email" />);

    const field = screen.getByLabelText('Email');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(screen.getByText('Enter a valid email').id);
  });

  it('shows helper text only while there is no error', () => {
    const { rerender } = render(<Input label="Code" helperText="Two letters and a number" />);
    expect(screen.getByText('Two letters and a number')).toBeTruthy();

    rerender(<Input label="Code" helperText="Two letters and a number" error="Code is taken" />);
    expect(screen.queryByText('Two letters and a number')).toBeNull();
    expect(screen.getByText('Code is taken')).toBeTruthy();
  });

  it('keeps the required marker out of the accessible name', () => {
    render(<Input label="Таны нэр" required />);

    // The asterisk is decoration; querying by the plain label must still work.
    expect(screen.getByLabelText('Таны нэр')).toBeTruthy();
    expect(screen.getByLabelText('Таны нэр').hasAttribute('required')).toBe(true);
  });

  it('forwards typing to the caller', () => {
    const onChange = vi.fn();
    render(<Input label="Search" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'audit' } });

    expect(onChange).toHaveBeenCalled();
  });
});

describe('Select', () => {
  it('labels the control and reports the chosen value', () => {
    const onChange = vi.fn();
    render(
      <Select label="Status" defaultValue="active" onChange={onChange}>
        <option value="active">Active</option>
        <option value="on_hold">On hold</option>
      </Select>,
    );

    const control = screen.getByLabelText('Status') as HTMLSelectElement;
    expect(control.value).toBe('active');

    fireEvent.change(control, { target: { value: 'on_hold' } });

    expect(onChange).toHaveBeenCalled();
    expect(control.value).toBe('on_hold');
  });

  it('marks an invalid select for assistive technology', () => {
    render(
      <Select label="Owner" error="Pick an owner">
        <option value="">Unassigned</option>
      </Select>,
    );

    expect(screen.getByLabelText('Owner').getAttribute('aria-invalid')).toBe('true');
  });
});
