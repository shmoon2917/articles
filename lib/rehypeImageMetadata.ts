import sizeOf from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import path from 'path';
import { getPlaiceholder } from 'plaiceholder';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

export type ImageNode = {
  type: 'element';
  tagName: 'img';
  properties: {
    src: string;
    height?: number;
    width?: number;
    blurDataURL?: string;
    placeholder?: 'blur' | 'empty';
  };
};

export function isImageNode(node: Node): node is ImageNode {
  const img = node as ImageNode;
  return img.type === 'element' && img.tagName === 'img' && img.properties && typeof img.properties.src === 'string';
}

export async function addProps(node: ImageNode): Promise<void> {
  let res: ISizeCalculationResult | undefined;
  let blur64: string;

  // Local인지 아닌지 판명
  const isExternal = node.properties.src.startsWith('http');

  if (!isExternal) {
    res = sizeOf(path.join(process.cwd(), 'public', node.properties.src));
    blur64 = (await getPlaiceholder(node.properties.src)).base64;
  } else {
    const imageRes = await fetch(node.properties.src);

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res = await sizeOf(buffer);
    blur64 = (await getPlaiceholder(buffer)).base64;
  }

  if (!res) throw Error(`이미지가 올바르지 않습니다. "${node.properties.src}"`);

  node.properties.width = res.width;
  node.properties.height = res.height;

  node.properties.blurDataURL = blur64;
  node.properties.placeholder = 'blur';
}

const imageMetadata = () => {
  return async function transformer(tree: Node): Promise<Node> {
    const images: ImageNode[] = [];

    visit(tree, 'element', (node) => {
      if (isImageNode(node)) {
        images.push(node);
      }
    });

    for (const image of images) {
      await addProps(image);
    }

    return tree;
  };
};

export default imageMetadata;
