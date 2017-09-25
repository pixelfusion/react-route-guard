import * as React from 'react';
import { Route, RouteProps, Redirect } from 'react-router-dom'
import { Observable } from 'rxjs'

const EnhancedRouteLoggerConsoleTheme = {
    normal: '',
    testing: 'color: darkcyan; font-size: 0.7rem; font-style: italic;',
    important: 'color: green; font-size: 0.7rem; font-style: normal; font-weight: bold',
    error: 'color: red; font-size: 0.7rem; font-style: normal; font-weight: bold'
};

const debugLogger = (className: string, methodName: string, msg: string, displayFormat?: string, extraData?: any) => {

    const messageToPrint = displayFormat ? `%c[${className} - ${methodName}] ${msg}` : `[${className} - ${methodName}] ${msg}`;

    if (displayFormat) {
        if (extraData) {
            console.log(messageToPrint, displayFormat, extraData);
        } else {
            console.log(messageToPrint, displayFormat);
        }
    } else {
        if (extraData) {
            console.log(messageToPrint, extraData);
        } else {
            console.log(messageToPrint);
        }
    }
}

export type RouteGuardResultType = boolean | Promise<boolean> | Observable<boolean>

/**
 * @export
 * @interface RouteGuard
 */
export interface RouteGuard {
    shouldRoute: () => RouteGuardResultType
}


export interface EnhancedRouteProps extends RouteProps {
    routeGuard?: RouteGuard
    redirectToPathWhenFail?: string
    enableDebug?: boolean
}

interface EnhancedRouteState {
    hasRouteGuard: boolean
    routeGuardFinished: boolean
    routeGuardResult: JSX.Element
}

/**
 * @export
 * @class EnhancedRoute
 * @extends {React.Component<EnhancedRouteProps, EnhancedRouteState>}
 */
export class EnhancedRoute extends React.Component<EnhancedRouteProps, EnhancedRouteState> {

    /**
     * Creates an instance of EnhancedRoute.
     * @param {EnhancedRouteProps} props 
     * @memberof EnhancedRoute
     */
    constructor(props: EnhancedRouteProps) {
        super(props)
        this.state = {
            hasRouteGuard: this.props.routeGuard ? true : false,
            routeGuardFinished: false,
            routeGuardResult: null
        }
    }

    /**
     * @memberof EnhancedRoute
     */
    async componentDidMount() {
        if (!this.state.hasRouteGuard) {
            return
        }
        const tempRouteGuardResult = this.props.routeGuard.shouldRoute()
        if (typeof (tempRouteGuardResult) === 'boolean') {
            this.setState((prevState: EnhancedRouteState, props) => ({
                hasRouteGuard: prevState.hasRouteGuard,
                routeGuardFinished: true,
                routeGuardResult: tempRouteGuardResult
            }))
        } else if (tempRouteGuardResult instanceof Promise) {
            tempRouteGuardResult.then(result => {
                this.setState((prevState: EnhancedRouteState, props) => ({
                    hasRouteGuard: prevState.hasRouteGuard,
                    routeGuardFinished: true,
                    routeGuardResult: result
                }))
            })
        } else if (tempRouteGuardResult instanceof Observable) {
            tempRouteGuardResult.take(1).subscribe(result => {
                this.setState((prevState: EnhancedRouteState, props) => ({
                    hasRouteGuard: prevState.hasRouteGuard,
                    routeGuardFinished: true,
                    routeGuardResult: result
                }))
            })
        }
    }

    /**
     * @returns 
     * @memberof EnhancedRoute
     */
    render() {
        // /**
        //  * Test Code here
        //  */
        // return (
        //     <div>Route Guard state: {JSON.stringify(this.state, null, 4)}</div>
        // )

        // The real <Route> component
        const successRoute: JSX.Element = <Route {...this.props} />

        // If hasn't `this.props.routeGuard`, then just render the real <Route>
        if (!this.state.hasRouteGuard) {
            if (this.props.enableDebug) {
                debugLogger((this as any).constructor.name, `render`, `no route guard to run, render normal <Route> directly.`, EnhancedRouteLoggerConsoleTheme.testing)
            }

            return successRoute
        }

        const failRedirect = <Redirect to={this.props.redirectToPathWhenFail} />

        if (this.state.routeGuardFinished) {
            if (this.props.enableDebug) {
                let debugMsg = `route guard passed, render <Route>.`,
                    className = (this as any).constructor.name,
                    debugTheme = EnhancedRouteLoggerConsoleTheme.testing

                if (!this.state.routeGuardResult) {
                    debugMsg = `route guard fail, render <Redirect to=${this.props.redirectToPathWhenFail} />`
                    debugTheme = EnhancedRouteLoggerConsoleTheme.error
                }

                debugLogger(className, `render`, debugMsg, debugTheme)
            }

            return this.state.routeGuardResult ? successRoute : failRedirect
        } else {
            return null
        }
    }
}