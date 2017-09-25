import * as React from 'react';
import { RouteProps } from 'react-router-dom';
import { Observable } from 'rxjs';
export declare type RouteGuardResultType = boolean | Promise<boolean> | Observable<boolean>;
export interface RouteGuard {
    shouldRoute: () => RouteGuardResultType;
}
export interface EnhancedRouteProps extends RouteProps {
    routeGuard?: RouteGuard;
    redirectToPathWhenFail?: string;
    enableDebug?: boolean;
}
export interface EnhancedRouteState {
    hasRouteGuard: boolean;
    routeGuardFinished: boolean;
    routeGuardResult: JSX.Element;
}
export declare class EnhancedRoute extends React.Component<EnhancedRouteProps, EnhancedRouteState> {
    constructor(props: EnhancedRouteProps);
    componentDidMount(): Promise<void>;
    render(): JSX.Element;
}
