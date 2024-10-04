// Copyright (c) Thorsten Beier
// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import {
  IServiceWorkerManager,
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';
import { IBroadcastChannelWrapper } from '@jupyterlite/contents';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { WebWorkerKernel } from './web_worker_kernel';
import { Token } from '@lumino/coreutils';
import { UnpackCondaPackages } from './unpack';

function getJson(url: string) {
  const json_url = URLExt.join(PageConfig.getBaseUrl(), url);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', json_url, false);
  xhr.send(null);
  return JSON.parse(xhr.responseText);
}

let kernel_list: string[] = [];
try {
  kernel_list = getJson('xeus/kernels.json');
} catch (err) {
  console.log(`Could not fetch xeus/kernels.json: ${err}`);
  throw err;
}

const plugins = kernel_list.map((kernel): JupyterLiteServerPlugin<void | IUnpackPackage> => {
  return {
    id: `@jupyterlite/xeus-${kernel}:register`,
    autoStart: true,
    requires: [IKernelSpecs],
    optional: [IServiceWorkerManager, IBroadcastChannelWrapper],
    activate: (
      app: JupyterLiteServer,
      kernelspecs: IKernelSpecs,
      serviceWorker?: IServiceWorkerManager,
      broadcastChannel?: IBroadcastChannelWrapper
    ) => {
      // Fetch kernel spec
      const kernelspec = getJson('xeus/kernels/' + kernel + '/kernel.json');
      kernelspec.name = kernel;
      kernelspec.dir = kernel;
      for (const [key, value] of Object.entries(kernelspec.resources)) {
        kernelspec.resources[key] = URLExt.join(
          PageConfig.getBaseUrl(),
          value as string
        );
      }

      const contentsManager = app.serviceManager.contents;

      kernelspecs.register({
        spec: kernelspec,
        create: async (options: IKernel.IOptions): Promise<IKernel> => {
          const mountDrive = !!(
            (serviceWorker?.enabled && broadcastChannel?.enabled) ||
            crossOriginIsolated
          );

          if (mountDrive) {
            console.info(
              `${kernelspec.name} contents will be synced with Jupyter Contents`
            );
          } else {
            console.warn(
              `${kernelspec.name} contents will NOT be synced with Jupyter Contents`
            );
          }

          return new WebWorkerKernel({
            ...options,
            contentsManager,
            mountDrive,
            kernelSpec: kernelspec
          });
        }
      });
    }
  };
});
export interface IUnpackPackage {
  /**
   * Get empack_env_meta link.
   */
  unpack:()=> void;
}

export const IUnpackPackageManager = new Token<IUnpackPackage>('@jupyterlite/xeus-python:IUnpackPackageManager');

const unpackPackage: JupyterLiteServerPlugin<IUnpackPackage> = {
  id: `@jupyterlite/xeus-python:unpack-conda-package`,
  autoStart: true,
  provides: IUnpackPackageManager,
  activate: (): IUnpackPackage => {
    return {
      unpack(){ 
        const url = "https://conda.anaconda.org/conda-forge/linux-64/_libgcc_mutex-0.1-conda_forge.tar.bz2";
        const condaManager = new UnpackCondaPackages({url});
        condaManager.fetchCondaPackage();
      }
    };
  },
};



plugins.push(unpackPackage);
export default plugins;
