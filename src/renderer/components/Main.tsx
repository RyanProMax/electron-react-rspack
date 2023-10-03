import { CHANNELS, PAGES } from '../../common/constant';

export default () => {
  const openWindow = () =>
    window.__ELECTRON__.ipcRenderer.invoke(
      CHANNELS.CREATE_WINDOW,
      {
        htmlFileName: PAGES.SUB_PAGE,
      }
    );

  return (
    <div>
      <h1>Electron React Rspack</h1>
      <button onClick={openWindow}>
        open sub window
      </button>
    </div>
  );
};
