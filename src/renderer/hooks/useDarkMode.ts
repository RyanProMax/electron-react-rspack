import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from '@arco-design/web-react/icon';

export enum THEME {
  Light = 'light',
  Dark = 'dark',
}

const ThemeStorageKey = '__THEME__';

const mediaQueryListDark = window.matchMedia('(prefers-color-scheme: dark)');
const defaultTheme = window.localStorage.getItem(ThemeStorageKey) ||
  (mediaQueryListDark.matches ? THEME.Dark : THEME.Light);

export default () => {
  const [theme, setTheme] = useState(defaultTheme as THEME);
  const ThemeIcon = theme === THEME.Light ? IconSun : IconMoon;

  const toggleTheme = () => setTheme(t => t === THEME.Dark ? THEME.Light : THEME.Dark);

  useEffect(() => {
    window.localStorage.setItem(ThemeStorageKey, theme);
    if (theme === THEME.Light) {
      document.body.removeAttribute('arco-theme');
    } else {
      document.body.setAttribute('arco-theme', THEME.Dark);
    }
  }, [theme]);

  useEffect(() => {
    const handleChangeTheme = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? THEME.Dark : THEME.Light);
    };

    mediaQueryListDark.addEventListener('change', handleChangeTheme);
    return () => mediaQueryListDark.removeEventListener('change', handleChangeTheme);
  }, []);

  return { ThemeIcon, theme, toggleTheme };
};
