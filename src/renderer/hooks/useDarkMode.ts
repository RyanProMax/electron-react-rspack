import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from '@arco-design/web-react/icon';
import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';

export enum THEME {
  Light = 'light',
  Dark = 'dark',
}

const ThemeStorageKey = '__THEME__';

const mediaQueryListDark = window.matchMedia('(prefers-color-scheme: dark)');

const getTheme = () => (window.localStorage.getItem(ThemeStorageKey) as THEME) ||
  (mediaQueryListDark.matches ? THEME.Dark : THEME.Light);

const refreshTheme = (theme: THEME) => {
  if (theme === THEME.Light) {
    document.body.removeAttribute('arco-theme');
  } else {
    document.body.setAttribute('arco-theme', THEME.Dark);
  }
};

export default () => {
  const [theme, setTheme] = useState(getTheme());
  const ThemeIcon = theme === THEME.Light ? IconSun : IconMoon;

  const toggleTheme = () => {
    const _t = theme === THEME.Dark ? THEME.Light : THEME.Dark;
    setTheme(_t);
    ipcRenderer.send(
      Channels.Broadcast,
      Channels.ToggleTheme,
      _t
    );
  };

  useEffect(() => {
    window.localStorage.setItem(ThemeStorageKey, theme);
    refreshTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleChangeTheme = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? THEME.Dark : THEME.Light);
    };

    mediaQueryListDark.addEventListener('change', handleChangeTheme);
    return () => mediaQueryListDark.removeEventListener('change', handleChangeTheme);
  }, []);

  useEffect(() => {
    const updateTheme = (_: Electron.IpcRendererEvent, _theme: THEME) => {
      setTheme(_theme);
    };

    ipcRenderer.on(Channels.ToggleTheme, updateTheme);
    return () => {
      ipcRenderer.removeListener(Channels.ToggleTheme, updateTheme);
    };
  }, []);

  return { ThemeIcon, theme, toggleTheme };
};
