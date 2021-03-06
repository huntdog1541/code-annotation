import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import { push } from 'redux-little-router';
import SplitPane from 'react-split-pane';
import Page from './Page';
import Loader from '../components/Loader';
import Breadcrumbs from '../components/Breadcrumbs';
import Selector from '../components/Experiment/Selector';
import Diff from '../components/Experiment/Diff';
import Results from '../components/Review/Results';
import { makeUrl } from '../state/routes';
import { getCurrentFilePair, loadFilePair } from '../state/filePairs';
import {
  getFeatures,
  mostSimilar,
  leastSimilar,
  getScore,
} from '../state/features';
import { toggleInvisible } from '../state/user';
import './Review.less';

class Review extends Component {
  render() {
    const { loading, name, filePairsOptions, onSelect } = this.props;

    if (loading) {
      return (
        <Row className="review-page__loader">
          <Col xs={12}>
            <Loader />
          </Col>
        </Row>
      );
    }

    return (
      <Grid fluid className="review-page__grid">
        <Row
          className="review-page__header"
          onMouseEnter={this.props.showHeader}
        >
          <Col xs={8} className="review-page__breadcrumbs">
            <Breadcrumbs
              items={[{ name, link: '#' }, { name: 'review', link: '#' }]}
            />
          </Col>
          <Col xs={4} className="review-page__controls">
            <Selector
              title="Previous"
              options={filePairsOptions}
              onChange={e => onSelect(e.target.value)}
            />
          </Col>
        </Row>
        {this.renderContent()}
      </Grid>
    );
  }

  renderContent() {
    const {
      experimentId,
      fileLoading,
      filePair,
      annotations,
      mostSimilarFeatures,
      leastSimilarFeatures,
      features,
      score,
    } = this.props;

    if (fileLoading || !filePair) {
      return (
        <Row className="review-page__loader">
          <Col xs={12}>
            <Loader />
          </Col>
        </Row>
      );
    }

    return (
      <Row
        className="review-page__main-row"
        onMouseEnter={this.props.hideHeader}
      >
        <Col xs={12} className="review-page__main-col">
          {/* we need this wrapper because SplitPane hard coded width 100% */}
          <div className="review-page__split">
            <SplitPane
              split="horizontal"
              minSize={50}
              defaultSize={100}
              style={{ width: 'auto' }}
            >
              <Diff
                diffString={filePair.diff}
                leftLoc={filePair.leftLoc}
                rightLoc={filePair.rightLoc}
                showInvisible={this.props.showInvisible}
                toggleInvisible={() =>
                  this.props.toggleInvisible(experimentId, filePair.id)
                }
                className="review-page__diff"
              />
              <Results
                className="results"
                score={score}
                annotations={annotations}
                features={features}
                mostSimilarFeatures={mostSimilarFeatures}
                leastSimilarFeatures={leastSimilarFeatures}
              />
            </SplitPane>
          </div>
        </Col>
      </Row>
    );
  }
}

const mapStateToProps = state => {
  const { experiment, filePairs, user } = state;
  const { error, loading, fileLoading, name, description } = experiment;
  const { list: filePairsList, currentAnnotations } = filePairs;
  const { showInvisible } = user;

  const filePairsOptions = filePairsList.map((a, i) => ({
    value: a.id,
    name: `(${i + 1})`,
  }));

  const score = getScore(state);
  const features = getFeatures(state);
  // keep only 100 results
  // it will be improved (most probably with pagination) later
  const mostSimilarFeatures = mostSimilar(state).slice(0, 100);
  const leastSimilarFeatures = leastSimilar(state).slice(0, 100);

  return {
    experimentId: experiment.id,
    error,
    loading,
    name,
    description,
    filePairsOptions,
    fileLoading,
    filePair: getCurrentFilePair(state),
    annotations: currentAnnotations,
    mostSimilarFeatures,
    leastSimilarFeatures,
    features,
    score,
    showInvisible,
  };
};

const experimentId = 1;
const mapDispatchToProps = dispatch => ({
  onSelect: pairId =>
    dispatch(
      push(makeUrl('reviewPair', { experiment: experimentId, pair: pairId }))
    ),
  toggleInvisible: (expId, id) => {
    dispatch(toggleInvisible());
    return dispatch(loadFilePair(expId, id));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(
  Page(Review, {
    className: 'review-page',
    titleFn: props => `Review for experiment ${props.name}`,
  })
);
