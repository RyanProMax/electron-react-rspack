// @ts-check
import path from 'node:path';

/** @param {'main' | 'preload' | 'renderer'} name */
export async function analysisPlugins(name) {
  if (process.env.RSDOCTOR !== 'true') return [];
  const { RsdoctorRspackPlugin } = await import('@rsdoctor/core');
  return [
    new RsdoctorRspackPlugin({
      disableClientServer: true,
      output: {
        reportDir: path.resolve(import.meta.dirname, '../build/analysis', name),
        mode: 'brief',
        options: { type: ['html', 'json'] },
      },
    }),
  ];
}
