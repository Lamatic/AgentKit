import type { ImageLoaderProps } from 'next/dist/shared/lib/image-config';
import type { ImageProps, ImageLoader, StaticImageData } from 'next/dist/shared/lib/get-img-props';
import { Image } from 'next/dist/client/image-component';
/**
 * For more advanced use cases, you can call `getImageProps()`
 * to get the props that would be passed to the underlying `<img>` element,
 * and instead pass to them to another component, style, canvas, etc.
 *
 * Read more: [Next.js docs: `getImageProps`](https://nextjs.org/docs/app/api-reference/components/image#getimageprops)
 */
export declare function getImageProps(imgProps: ImageProps): {
    props: import("next/dist/shared/lib/get-img-props").ImgProps;
};
export default Image;
export type { ImageProps, ImageLoaderProps, ImageLoader, StaticImageData };
