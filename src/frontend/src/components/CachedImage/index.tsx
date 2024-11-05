import { forwardRef, memo, useEffect, useState } from "react";
import { VariantProps, tv } from "tailwind-variants";
import { Skeleton, SuspenseComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";

const CachedImageVariants = tv(
    {
        variants: {
            size: {
                "1": "size-1",
                "2": "size-2",
                "3": "size-3",
                "4": "size-4",
                "5": "size-5",
                "6": "size-6",
                "7": "size-7",
                "8": "size-8",
                "9": "size-9",
                "10": "size-10",
                "11": "size-11",
                "12": "size-12",
                "14": "size-14",
                full: "size-full",
            },
        },
        defaultVariants: {
            size: undefined,
        },
    },
    {
        responsiveVariants: true,
    }
);

interface ICachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement>, VariantProps<typeof CachedImageVariants> {
    fallback?: React.ReactNode;
}

const imageCache = new Map<string, HTMLImageElement>();

const lazyImage = (src: string) => {
    return new Promise((resolve, reject) => {
        if (imageCache.has(src)) {
            resolve(imageCache.get(src));
            return;
        }

        const image = new Image();
        image.onload = () => {
            imageCache.set(src, image);
            resolve(image);
        };
        image.onerror = reject;
        image.src = src;
    });
};

const CachedImage = memo(
    forwardRef<HTMLImageElement, ICachedImageProps>(({ size, src, fallback, className, ...props }, ref) => {
        const [image, setImage] = useState<React.ReactNode | null>(null);

        const classNames = cn(CachedImageVariants({ size }), className);

        useEffect(() => {
            if (!src) {
                setImage(fallback ?? null);
                return;
            }

            lazyImage(src)
                .then(() => {
                    setImage(<img ref={ref} src={src} className={classNames} {...props} />);
                })
                .catch(() => {
                    setImage(fallback ?? <Skeleton className={classNames} />);
                });
        }, []);

        return <SuspenseComponent className={classNames}>{image}</SuspenseComponent>;
    })
);

export default CachedImage;
