import { select, selectAll } from 'd3-selection';
import type { Selection, BaseType } from 'd3-selection';
import * as d3 from 'd3';

import type { FundFlowNode, FundFlowRes } from './dot';
import { getContrastColor, decodeUnicode } from './utils';

export const GRAPH_TEMP = 'GRAPH_TEMP';
const NODE_HOVER_HEIGHT = 32;
const IMAGE_CENTER_TO_LEFT_PX = 85;

export const formatLabel = (label: string) => {
  return label.length > 20 ? `${label.slice(0, 20)}...` : decodeUnicode(label);
};

export const clearGraphTemp = () => {
  select(`.${GRAPH_TEMP}`).each(function () {
    select(this).remove();
  });
};

export const nodeStrokeWidthChange = (
  ele: Selection<BaseType, unknown, null, undefined>,
  color: string,
  width: string
) => {
  ele.selectAll('path').each(function (_: any, index: number) {
    if (index === 0) {
      select(this).attr('stroke', color);
      select(this).attr('stroke-width', width);
    } else {
      select(this).attr('stroke', color);
    }
  });
};

export const nodeHover = (
  ele: Selection<BaseType, unknown, null, undefined>,
  key: string,
  nodeData: FundFlowNode
) => {
  clearGraphTemp();

  const nodeAClone: Selection<BaseType, unknown, null, undefined> = ele.clone(true);

  nodeAClone.classed('pointer', true);

  nodeAClone.selectAll('text').each(function (_: any, index: number) {
    if (nodeData?.label) {
      if (index === 0) {
        select(this).text(`${formatLabel(nodeData.label)}`);
      }
      if (index === 1) {
        select(this).text(`${nodeData.address.slice(0, 22)}`);
      }
      if (index === 2) {
        select(this).text(`${nodeData.address.slice(22, nodeData.address.length)}`);
      }
    } else {
      if (index === 0) {
        select(this).text(`${nodeData.address.slice(0, 22)}`);
      }
      if (index === 1) {
        select(this).text(`${nodeData.address.slice(22, nodeData.address.length)}`);
      }
    }
  });

  nodeAClone?.selectAll('path').each(function () {
    const dom = select(this);

    const pathList = (dom.attr('d') as string)
      ?.split(' ')
      .map((v) => v.split(','));

    const _m = [pathList[0][0].split('M')[1], pathList[0][1].split('C')[0]];
    const _c = [pathList[0][1].split('C')[1], pathList[0][2]];

    pathList.shift();
    pathList.unshift(_c);
    pathList.unshift(_m);

    if (pathList?.length === 25) {
      // common nodes
      pathList.forEach((v, i) => {
        if (i >= 8 && i <= 19) {
          v[1] = `${Number(v[1]) + NODE_HOVER_HEIGHT}`;
        }
      });
    }

    if (pathList?.length === 49) {
      // cross chain nodes
      const _y = Number(pathList[0][1]) - Number(dom.attr('stroke-width'));

      pathList.forEach((v, i) => {
        if (i >= 25 || i === 1 || i === 0) {
          v[1] = `${Number(_y) + NODE_HOVER_HEIGHT * 2}`;
        }
      });
    }

    dom.attr(
      'd',
      pathList
        ?.reduce((pre, cur, index) => {
          if (index === 0) {
            cur[0] = 'M' + cur[0];
          }
          if (index === 1) {
            cur[0] = 'C' + cur[0];
          }
          return pre + ' ' + cur.join(',');
        }, '')
        .trim()
    );
  });

  nodeAClone.classed(GRAPH_TEMP, true);

  // We omit image button renders for "Analyze" and "Edit" here since we don't need them in c_trackr for now.

  select('#graph0')?.append(() => {
    return nodeAClone.node();
  });

  nodeAClone.on('mouseleave', () => {
    clearGraphTemp();
  });
};

export const initNodes = (fundFlow: FundFlowRes) => {
  const nodes = selectAll('#graph0 .node');

  nodes.each(function (d3Ele: any) {
    const node = select(this);
    const item = fundFlow.nodes.find((v) => v.id === d3Ele.key)!;

    if (!item) return;

    node.select('path').attr('fill', item.color);

    // Initializes the position of the image
    const _image = node.select('image');
    if (_image) {
      const _x = _image?.attr('x') ?? 0;
      _image?.attr('x', `${Number(_x) - IMAGE_CENTER_TO_LEFT_PX}`);
    }

    // Initializes the position and color of the text
    node.selectAll('text').each(function (_, index: number) {
      select(this).attr('x', Number(select(this).attr('x')) - 48);
      if (item.address.length < 22) {
        select(this).attr('y', Number(select(this).attr('y')) + 5);
      }
      if (!item.label || (item.label && !!index)) {
        select(this).attr('fill', `${getContrastColor(item.color)}90`);
      }
      // Set to generic light gray or white for dark mode if getContrastColor isn't perfect
      if (index > 0) select(this).attr('fill', '#939393');
    });

    node.on('mouseenter', () => {
      nodeStrokeWidthChange(node, '#c1995c', '3'); // highlight ring
      nodeHover(node, d3Ele.key, item);
    });

    node.on('mouseleave', () => {
      nodeStrokeWidthChange(node, '#353a45', '1'); // back to border color
    });
  });
};
