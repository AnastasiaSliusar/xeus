import tar from 'tar-stream';
//import compressjs from 'compressjs';
import { decompress } from 'bz2';

export class UnpackCondaPackages {
  /**
   * Instantiate a new UnpackCondaPackages
   *
   * @param options The instantiation options for a new UnpackCondaPackages
   */
  constructor(options: UnpackCondaPackages.IOptions) {
    const { url } = options;
    this._files = {};
    this._url = url;
  }

  private _decompressBzip2(data) {
    return decompress(data);
  }

  async fetchByteArray(url) {
    let response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let arrayBuffer = await response.arrayBuffer();
    let byte_array = new Uint8Array(arrayBuffer);
    return byte_array;
  }

  private async _fetchAndUntarPackage(url) {
    try {
      const compressedData = await this.fetchByteArray(url);
      console.log(compressedData);
      const decompressedData = this._decompressBzip2(compressedData);
      console.log('decompressedData');
      const extract = tar.extract();
      const files = {};

      extract.on('entry', function (header, stream, next) {
        const fileName = header.name;
        let fileContent = '';

        stream.on('data', function (chunk) {
          fileContent += chunk.toString();
        });

        stream.on('end', function () {
          files[fileName] = fileContent;
          next();
        });


        stream.on('error', function (err) {
          console.error(`Error reading stream for ${fileName}:`, err);
          next(err);
        });
      });

      extract.on('finish', function () {
        console.log('All files extracted:', files);
      });

      extract.write(decompressedData);
      extract.end();

      return files;
    } catch (error) {
      console.error('Error fetching or untarring the package:', error);
      throw error;
    }
  }

  fetchCondaPackage() {
    this._fetchAndUntarPackage(this._url)
      .then((files) => {
        this._files = files;
        console.log('Successfully fetched and extracted the BZIP2 tar package!', files);
      })
      .catch((err) => {
        console.error('Failed to fetch and extract BZIP2 tar package:', err);
      });
  }
  private _files: {};
  private _url: string;
}

/**
 * A namespace for UnpackCondaPackages statics.
 */
export namespace UnpackCondaPackages {
  /**
   * The url where a conda package is hosted
   */
  export interface IOptions {
    url: string
  }

}