/// <reference types="react" />
import * as React from 'react';
import { RouteProps, RouteComponentProps } from 'react-router-dom';
import { Observable } from 'rxjs';
export declare type RouteGuardResultType = boolean | Promise<boolean> | Observable<boolean>;
export interface RouteGuard {
    shouldRoute: () => RouteGuardResultType;
}
export interface SecureRouteProps extends RouteProps {
    routeGuard?: RouteGuard;
    redirectToPathWhenFail?: string;
    enableDebug?: boolean;
    componentWhenFail?: React.ComponentType<RouteComponentProps<any> | {}>;
}
export interface SecureRouteState {
    hasRouteGuard: boolean;
    routeGuardFinished: boolean;
    routeGuardResult: JSX.Element;
}
export declare class SecureRoute extends React.Component<SecureRouteProps, SecureRouteState> {
    constructor(props: SecureRouteProps);
    componentDidMount(): Promise<void>;
    render(): JSX.Element;
}
