
import sharp from "sharp";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import * as utils from '@strapi/utils';

const { bytesToKbytes } = utils.file;
const FORMATS_TO_RESIZE = [
  'jpeg',
  'png',
  'webp',
  'tiff',
  'gif'
];
const FORMATS_TO_PROCESS = [
  'jpeg',
  'png',
  'webp',
  'tiff',
  'svg',
  'gif',
  'avif'
];
const FORMATS_TO_OPTIMIZE = [
  'jpeg',
  'png',
  'webp',
  'tiff',
  'avif'
];
const isOptimizableFormat = (format: any) => format !== undefined && FORMATS_TO_OPTIMIZE.includes(format);
const writeStreamToFile = (stream: any, path: any) => new Promise((resolve: any, reject: any) => {
  const writeStream = fs.createWriteStream(path);
  // Reject promise if there is an error with the provided stream
  stream.on('error', reject);
  stream.pipe(writeStream);
  writeStream.on('close', resolve);
  writeStream.on('error', reject);
});
const getMetadata = (file: any): any => {
  if (!file.filepath) {
    return new Promise((resolve, reject)=>{
      const pipeline = sharp();
      pipeline.metadata().then(resolve).catch(reject);
      file.getStream().pipe(pipeline);
    });
  }
  return sharp(file.filepath).metadata();
};
const getDimensions = async (file: any): Promise<{ width: number | null, height: number | null }> => {
  console.log('Custom getDimensions called');
  const { width = null, height = null } = await getMetadata(file);
  return {
    width,
    height
  };
};
const THUMBNAIL_RESIZE_OPTIONS = {
  width: 100,
  height: 100,
  fit: 'inside'
};
const resizeFileTo = async (
  file: any,
  options: any,
  { name, hash }: { name: string, hash: string },
  is_cropped: boolean = false
) => {
  console.log('Custom resizeFileTo called', name, is_cropped);
  const filePath = file.tmpWorkingDirectory ? path.join(file.tmpWorkingDirectory, hash) : hash;
  let newInfo: any;

  // Prepare sharp transformation
  let transformSharp: any;
  if (!file.filepath) {
    transformSharp = sharp();
  } else {
    transformSharp = sharp(file.filepath);
  }

  // If is_cropped is true, crop to square before resizing
  if (is_cropped) {
    // Crop to square: center crop based on smallest dimension
    const metadata = await getMetadata(file);
    const minDim = Math.min(metadata.width ?? 0, metadata.height ?? 0);
    transformSharp = transformSharp.extract({
      left: Math.floor(((metadata.width ?? minDim) - minDim) / 2),
      top: Math.floor(((metadata.height ?? minDim) - minDim) / 2),
      width: minDim,
      height: minDim,
    });
  }

  transformSharp = transformSharp.resize(options);

  if (!file.filepath) {
    transformSharp.on('info', (info) => {
      newInfo = info;
    });
    await writeStreamToFile(file.getStream().pipe(transformSharp), filePath);
  } else {
    newInfo = await transformSharp.toFile(filePath);
  }

  // Always update width, height, size, sizeInBytes after transformation (including cropping)
  const { width, height, size } = newInfo ?? {};
  const newFile = {
    name,
    hash,
    ext: file.ext,
    mime: file.mime,
    filepath: filePath,
    path: file.path || null,
    getStream: () => fs.createReadStream(filePath),
    width,
    height,
    size: size ? bytesToKbytes(size) : 0,
    sizeInBytes: size,
  };
  return newFile;
};
const generateThumbnail = async (file: any)=>{
  console.log('Custom generateThumbnail called');
  if (file.width && file.height && (file.width > THUMBNAIL_RESIZE_OPTIONS.width || file.height > THUMBNAIL_RESIZE_OPTIONS.height)) {
    return resizeFileTo(file, THUMBNAIL_RESIZE_OPTIONS, {
      name: `thumbnail_${file.name}`,
     hash: `thumbnail_${file.hash}`
    }, true);
  }
  return null;
};
/**
 * Optimize image by:
 *    - auto orienting image based on EXIF data
 *    - reduce image quality
 *
 */
const optimize = async (file: any): Promise<any> => {
  console.log('Custom optimize called');
  const { sizeOptimization = false, autoOrientation = false } = await strapi.plugin('upload').service('upload').getSettings() ?? {};
  const { format, size } = await getMetadata(file);

  // Only optimize if allowed and format is optimizable
  if ((sizeOptimization || autoOrientation) && isOptimizableFormat(format)) {
    console.log('Optimizing image', { sizeOptimization, autoOrientation, format, size });
    let transformer;
    if (!file.filepath) {
      transformer = sharp();
    } else {
      transformer = sharp(file.filepath);
    }

    // Convert to webp and set quality
    transformer.webp({
      quality: sizeOptimization ? 80 : 100
    });

    // Rotate image based on EXIF data
    if (autoOrientation) {
      transformer.rotate();
    }

    const filePath = file.tmpWorkingDirectory
      ? path.join(file.tmpWorkingDirectory, `optimized-${file.hash}.webp`)
      : `optimized-${file.hash}.webp`;

    let newInfo;
    if (!file.filepath) {
      transformer.on('info', (info) => {
        newInfo = info;
      });
      await writeStreamToFile(file.getStream().pipe(transformer), filePath);
    } else {
      newInfo = await transformer.toFile(filePath);
    }

    const { width: newWidth, height: newHeight, size: newSize } = newInfo ?? {};
    const newFile = {
      ...file,
      ext: '.webp',
      mime: 'image/webp',
      filepath: filePath,
      getStream: () => fs.createReadStream(filePath),
    };

    if (newSize && size && newSize > size) {
      // Ignore optimization if output is bigger than original
      return file;
    }

    return Object.assign(newFile, {
      width: newWidth,
      height: newHeight,
      size: newSize ? bytesToKbytes(newSize) : 0,
      sizeInBytes: newSize
    });
  }
  return file;
};
const DEFAULT_BREAKPOINTS = {
  large: 1000,
  medium: 750,
  small: 500
};
const getBreakpoints = (): any => strapi.config.get('plugin::upload.breakpoints', DEFAULT_BREAKPOINTS);
const generateResponsiveFormats = async (file: any): Promise<any[]> => {
  console.log('Custom generateResponsiveFormats called');
  const { responsiveDimensions = false } = await strapi.plugin('upload').service('upload').getSettings() ?? {};
  if (!responsiveDimensions) return [];
  const originalDimensions = await getDimensions(file);
  const breakpoints = getBreakpoints();
  return Promise.all(Object.keys(breakpoints).map((key)=>{
    const breakpoint = breakpoints[key];
    if (breakpointSmallerThan(breakpoint, originalDimensions)) {
      return generateBreakpoint(key, {
        file,
        breakpoint
      });
    }
    return undefined;
  }));
};
const generateBreakpoint = async (key: string, { file, breakpoint }: { file: any; breakpoint: number })=>{
  const newFile = await resizeFileTo(file, {
    width: breakpoint,
    height: breakpoint,
    fit: 'inside'
  }, {
    name: `${key}_${file.name}`,
    hash: `${key}_${file.hash}`
  }, key !== 'large');
  return {
    key,
    file: newFile
  };
};
const breakpointSmallerThan = (breakpoint: number, { width, height }: { width: number; height: number })=>{
  return breakpoint < (width ?? 0) || breakpoint < (height ?? 0);
};
/**
 *  Applies a simple image transformation to see if the image is faulty/corrupted.
 */
const isFaultyImage = async (file: any): Promise<boolean> => {
  console.log('Custom isFaultyImage called');
  if (!file.filepath) {
    return new Promise((resolve: any, reject: any)=>{
      const pipeline = sharp();
      pipeline.stats().then(resolve).catch(reject);
      file.getStream().pipe(pipeline);
    });
  }
  try {
    await sharp(file.filepath).stats();
    return false;
  } catch (e) {
    return true;
  }
};
const isOptimizableImage = async (file: any): Promise<boolean> => {
  console.log('Custom isOptimizableImage called');
  let format;
  try {
    const metadata = await getMetadata(file);
    format = metadata.format;
  } catch (e) {
    // throw when the file is not a supported image
    return false;
  }
  return format && FORMATS_TO_OPTIMIZE.includes(format);
};
const isResizableImage = async (file: any): Promise<boolean> => {
  console.log('Custom isResizableImage called');
  let format;
  try {
    const metadata = await getMetadata(file);
    format = metadata.format;
  } catch (e) {
    // throw when the file is not a supported image
    return false;
  }
  return format && FORMATS_TO_RESIZE.includes(format);
};
const isImage = async (file: any): Promise<boolean> => {
  console.log('Custom isImage called');
  let format;
  try {
    const metadata = await getMetadata(file);
    format = metadata.format;
  } catch (e) {
    // throw when the file is not a supported image
    return false;
  }
  return format && FORMATS_TO_PROCESS.includes(format);
};
const generateFileName = (name: string): string => {
  console.log('Custom generateFileName called');
  const randomSuffix = () => crypto.randomBytes(5).toString('hex');
  const baseName = utils.strings.nameToSlug(name, {
    separator: '_',
    lowercase: false
  });
  return `${baseName}_${randomSuffix()}`;
};

export default (plugin: any) => {
  const originalService = plugin.services["image-manipulation"];

  plugin.services["image-manipulation"] = {
    ...originalService,
    isFaultyImage,
    isOptimizableImage,
    isResizableImage,
    isImage,
    getDimensions,
    generateResponsiveFormats,
    generateThumbnail,
    optimize,
    generateFileName,
  };
  return plugin;
}