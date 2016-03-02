import React from 'react';
import themeable from './themeable';
import JSONTree from '@alexkuz/react-json-tree';
import ActionPreviewHeader from './ActionPreviewHeader';
import JSONDiff from './JSONDiff';
import { Iterable } from 'immutable';

const IS_IMMUTABLE_KEY = '@@__IS_IMMUTABLE__@@';

function isImmutable(value) {
  return Iterable.isKeyed(value) || Iterable.isIndexed(value) || Iterable.isIterable(value);
}

function getItemString(createTheme, type, data) {
  let text;

  function getShortTypeString(val) {
    if (Array.isArray(val)) {
      return val.length > 0 ? '[…]' : '[]';
    } else if (val === null) {
      return 'null';
    } else if (val === undefined) {
      return 'undef';
    } else if (typeof val === 'object') {
      return Object.keys(val).length > 0 ? '{…}' : '{}';
    } else if (typeof val === 'function') {
      return 'fn';
    } else if (typeof val === 'string') {
      return `"${val.substr(0, 10) + (val.length > 10 ? '…' : '')}"`
    } else {
      return val;
    }
  }

  if (type === 'Object') {
    const keys = Object.keys(data);
    const str = keys
      .slice(0, 2)
      .map(key => `${key}: ${getShortTypeString(data[key])}`)
      .concat(keys.length > 2 ? ['…'] : [])
      .join(', ');

    text = `{ ${str} }`;
  } else if (type === 'Array') {
    const str = data
      .slice(0, 2)
      .map(getShortTypeString)
      .concat(data.length > 2 ? ['…'] : []).join(', ');

    text = `[${str}]`;
  } else {
    text = type;
  }

  const immutableStr = data[IS_IMMUTABLE_KEY] ? 'Immutable' : '';

  return <span {...createTheme('treeItemHint')}> {immutableStr} {text}</span>;
}

function convertImmutable(value) {
  if (isImmutable(value)) {
    value = value.toSeq().__toJS();
    Object.defineProperty(value, IS_IMMUTABLE_KEY, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: true
    });
  }

  return value;
}

const ActionPreview = ({
  theme, defaultTheme, delta, nextState, onInspectPath, inspectedPath, tab, onSelectTab
}) => {
  const createTheme = themeable({ ...theme, ...defaultTheme });

  const labelRenderer = (key, ...rest) =>
    <span>
      <span {...createTheme('treeItemKey')}>
        {key}
      </span>
      <span {...createTheme('treeItemPin')}
            onClick={() => onInspectPath([
              ...inspectedPath.slice(0, inspectedPath.length - 1),
              ...[key, ...rest].reverse()
            ])}>
        {'(pin)'}
      </span>
    </span>;

  return (
    <div key='actionPreview' {...createTheme('actionPreview')}>
      <ActionPreviewHeader {...{
        theme, defaultTheme, inspectedPath, onInspectPath, tab, onSelectTab
      }} />
      {tab === 'Diff' && delta &&
        <JSONDiff {...{ delta, labelRenderer, theme, defaultTheme }} />
      }
      {tab === 'Diff' && !delta &&
        <div {...createTheme('stateDiffEmpty')}>
          (states are equal)
        </div>
      }
      {tab === 'State' && nextState &&
        <JSONTree labelRenderer={labelRenderer}
                  data={nextState}
                  getItemString={(type, data) => getItemString(createTheme, type, data)}
                  postprocessValue={convertImmutable}
                  getItemStringStyle={
                    (type, expanded) => ({ display: expanded ? 'none' : 'inline' })
                  }
                  hideRoot />
      }
    </div>
  );
}

export default ActionPreview;