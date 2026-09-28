import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationContext } from '../contexts/NotificationContext';
import { useSaveFailure } from './useSaveFailure';

describe('saying something was not saved', () => {
  it('tells the person, in the words the server’s code maps to', () => {
    const addNotification = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationContext.Provider value={{ addNotification } as never}>{children}</NotificationContext.Provider>
    );
    const { result } = renderHook(() => useSaveFailure(), { wrapper });

    act(() => result.current({ response: { status: 403, data: { errorCode: 'ACCESS_DENIED' } } }));

    expect(addNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Not saved',
      message: 'You do not have access to this.',
    });
  });

  it('stays quiet rather than throwing outside the notification provider', () => {
    const { result } = renderHook(() => useSaveFailure());

    expect(() => result.current(new Error('offline'))).not.toThrow();
  });
});
