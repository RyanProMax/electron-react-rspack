import { useEffect, useState } from 'react';
import { pick } from 'lodash-es';

import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';

export default (pickProps: string[] = [
  'name',
  'author',
  'version',
  'description',
  'license',
]) => {
  const [packageJson, setPackageJson] = useState<PackageJson>();

  useEffect(() => {
    (async () => {
      const packageJsonStr = await ipcRenderer.invoke(Channels.GetPackageJson);
      const _packageJson = JSON.parse(packageJsonStr || '{}');
      setPackageJson(pickProps.length
        ? pick(_packageJson, pickProps)
        : _packageJson
      );
    })();
  }, []);

  return packageJson;
};
