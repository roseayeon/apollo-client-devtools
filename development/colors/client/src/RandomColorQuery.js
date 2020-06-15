import React, { useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_RANDOM_COLOR, GET_COLOR } from './queries';
import Color from './components/Color';
import RefreshIcon from './components/RefreshIcon';

const RandomColorQuery = () => {
  const [loadRandomColor, { data: randomColorData }] = useLazyQuery(GET_RANDOM_COLOR, { fetchPolicy: "network-only" });
  const [loadColor, { data }]  = useLazyQuery(GET_COLOR);
  const randomColorHexCode = randomColorData?.random?.color?.hex;

  useEffect(() => loadRandomColor(), [loadRandomColor]);

  useEffect(() => {
    if (randomColorHexCode) {
      loadColor({ variables: { hex: randomColorHexCode }});
    }
  }, [loadColor, randomColorHexCode]);

  const hexCode = data?.color?.hex?.value;
  const contrast = data?.color?.contrast?.value;

  return (
    <div className="query random-color">
      <h2>Random Color Query</h2>
      <a title="Request new color" onClick={() => loadRandomColor()}>
        <RefreshIcon />
      </a>
      <Color hexCode={hexCode} />
    </div>
  );
};

export default RandomColorQuery;