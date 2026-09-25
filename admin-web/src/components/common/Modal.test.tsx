import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        <p>Body</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exposes itself as a labelled modal dialog', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Delete project">
        <p>Body</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(screen.getByText('Delete project').id);
  });

  it('moves focus into the dialog and restores it on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { unmount } = render(
      <Modal isOpen onClose={vi.fn()} title="Focus">
        <button type="button">Inside</button>
      </Modal>,
    );

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);

    unmount();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('closes on escape and on a backdrop click', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen onClose={onClose} title="Closable">
        <p>Body</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <Modal isOpen onClose={onClose} title="Closable">
        <p>Body</p>
      </Modal>,
    );
    fireEvent.click(document.querySelector('[aria-hidden="true"]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('releases the page scroll lock when it closes', () => {
    const { unmount } = render(
      <Modal isOpen onClose={vi.fn()} title="Scroll">
        <p>Body</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('keeps focus in the field being typed in', async () => {
    // Every caller passes an inline arrow as `onClose`, so it is a new
    // function on each render. While the focus-trap effect depended on it,
    // each keystroke tore the effect down and set it up again — and setting
    // up moves focus to the first focusable element. Typing into any field in
    // any modal lost everything after the first character.
    const Harness = () => {
      const [value, setValue] = React.useState('');

      return (
        <Modal isOpen onClose={() => undefined} title="Invite">
          <label htmlFor="field">Email</label>
          <input id="field" value={value} onChange={(event) => setValue(event.target.value)} />
        </Modal>
      );
    };

    render(<Harness />);

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('new@example.com');
  });
});

describe('ConfirmDialog', () => {
  const setup = (overrides = {}) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Delete project"
        message="Operations rollout will be removed."
        confirmLabel="Delete project"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...overrides}
      />,
    );

    return { onConfirm, onCancel };
  };

  it('asks before doing the destructive thing', () => {
    const { onConfirm, onCancel } = setup();

    expect(screen.getByText('Operations rollout will be removed.')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels without confirming', () => {
    const { onConfirm, onCancel } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks a second confirm while the first is still running', () => {
    const { onConfirm } = setup({ loading: true });

    const confirmButton = screen.getByRole('button', { name: 'Delete project' }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);

    fireEvent.click(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
