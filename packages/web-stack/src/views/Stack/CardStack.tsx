import * as React from 'react';
import { Route, StackNavigationState } from '@react-navigation/native';

import { Props as HeaderContainerProps } from '../Header/HeaderContainer';
import CardContainer from './CardContainer';
import {
  WebStackDescriptorMap,
  WebStackNavigationOptions,
  WebStackDescriptor,
} from '../../types';

type Props = {
  state: StackNavigationState;
  descriptors: WebStackDescriptorMap;
  routes: Route<string>[];
  openingRouteKeys: string[];
  closingRouteKeys: string[];
  onOpenRoute: (props: { route: Route<string> }) => void;
  onCloseRoute: (props: { route: Route<string> }) => void;
  getPreviousRoute: (props: {
    route: Route<string>;
  }) => Route<string> | undefined;
  renderHeader: (props: HeaderContainerProps) => React.ReactNode;
  renderScene: (props: { route: Route<string> }) => React.ReactNode;
  onTransitionStart: (
    props: { route: Route<string> },
    closing: boolean
  ) => void;
  onTransitionEnd: (props: { route: Route<string> }, closing: boolean) => void;
};

type State = {
  routes: Route<string>[];
  descriptors: WebStackDescriptorMap;
  scenes: { route: Route<string>; descriptor: WebStackDescriptor }[];
};

const FALLBACK_DESCRIPTOR = Object.freeze({ options: {} });

export default class CardStack extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    if (
      props.routes === state.routes &&
      props.descriptors === state.descriptors
    ) {
      return null;
    }

    return {
      routes: props.routes,
      scenes: props.routes.map((route, index, self) => {
        const previousRoute = self[index - 1];
        const nextRoute = self[index + 1];

        const oldScene = state.scenes[index];

        const descriptor =
          props.descriptors[route.key] ||
          state.descriptors[route.key] ||
          (oldScene ? oldScene.descriptor : FALLBACK_DESCRIPTOR);

        const nextDescriptor =
          props.descriptors[nextRoute?.key] ||
          state.descriptors[nextRoute?.key];

        const previousDescriptor =
          props.descriptors[previousRoute?.key] ||
          state.descriptors[previousRoute?.key];

        const scene = {
          route,
          descriptor,
          __memo: [route, descriptor, nextDescriptor, previousDescriptor],
        };

        if (
          oldScene &&
          scene.__memo.every((it, i) => {
            // @ts-ignore
            return oldScene.__memo[i] === it;
          })
        ) {
          return oldScene;
        }

        return scene;
      }),
      descriptors: props.descriptors,
    };
  }

  state: State = {
    routes: [],
    scenes: [],
    descriptors: this.props.descriptors,
  };

  private getFocusedRoute = () => {
    const { state } = this.props;

    return state.routes[state.index];
  };

  render() {
    const {
      state,
      routes,
      closingRouteKeys,
      onOpenRoute,
      onCloseRoute,
      getPreviousRoute,
      renderHeader,
      renderScene,
      onTransitionStart,
      onTransitionEnd,
    } = this.props;

    const { scenes } = this.state;

    const focusedRoute = state.routes[state.index];

    return (
      <React.Fragment>
        {routes.map((route, index, self) => {
          const focused = focusedRoute.key === route.key;
          const scene = scenes[index];

          const { headerShown, cardStyle } = scene.descriptor
            ? scene.descriptor.options
            : ({} as WebStackNavigationOptions);

          const previousRoute = getPreviousRoute({ route: scene.route });

          let previousScene = scenes[index - 1];

          if (previousRoute) {
            // The previous scene will be shortly before the current scene in the array
            // So loop back from current index to avoid looping over the full array
            for (let j = index - 1; j >= 0; j--) {
              const s = scenes[j];

              if (s && s.route.key === previousRoute.key) {
                previousScene = s;
                break;
              }
            }
          }

          return (
            <CardContainer
              key={route.key}
              index={index}
              active={index === self.length - 1}
              focused={focused}
              closing={closingRouteKeys.includes(route.key)}
              scene={scene}
              previousScene={previousScene}
              cardStyle={cardStyle}
              getPreviousRoute={getPreviousRoute}
              getFocusedRoute={this.getFocusedRoute}
              headerShown={headerShown}
              renderHeader={renderHeader}
              renderScene={renderScene}
              onOpenRoute={onOpenRoute}
              onCloseRoute={onCloseRoute}
              onTransitionStart={onTransitionStart}
              onTransitionEnd={onTransitionEnd}
            />
          );
        })}
      </React.Fragment>
    );
  }
}
