import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes corrupted stored JSON and returns the initial value', async () => {
    localStorage.setItem('broken-key', '{broken-json');

    const { result } = renderHook(() => useLocalStorage('broken-key', { ready: true }));

    await waitFor(() => expect(result.current[0]).toEqual({ ready: true }));
    expect(localStorage.getItem('broken-key')).toBeNull();
  });

  it('updates state and localStorage together', () => {
    const { result } = renderHook(() => useLocalStorage('working-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('working-key')).toBe('"updated"');
  });
});
