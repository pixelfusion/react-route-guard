# React Route Guard

Based on `react-router-dom` with route guard functionality on top of it. It makes it easier to control permissions and roles on a route.

## Requirements

- Node <=7.1


## Install
```javascript
yarn add react-route-guard
```
You don't need to install `@types/react-route-guard`, as it's written in TypeScript and the npm module already has `index.d.ts` there.


## Concept
- **`SecureRoute`**

    `<SecureRoute>` works like same way as `<Route`> and therefore you can use it in the exact same way. To enable the `RouteGuard` features pass in extra props (see below). SecureRoute will then perform the following tasks:

    - No DOM component will be created before `<SecureRoute>` has finished its check

    - When the `<SecureRoute>` component has mounted, it will run `RouteGuard.shouldRoute()`. When this function is complete, `SecureRoute` will update the state. `RouteGuard.shouldRoute()` can synchronously return a `boolean` or asynchronously return a `Promise<boolean>` or `Observable<boolean>`

    - `SecureRoute.render()` will only render the route component when route guard has finished, and will render `<Redirect to={this.props.redirectToPathWhenFail | '/'} />` if the route guard check fails


```javascript
    <Router>
    <Switch>
        <SecureRoute path='/about' component={AboutComponent} />
        <SecureRoute path='/users' component={UserListComponent} routeGuard={UserRouteGuard} redirectToPathWhenFail='/login' />
        <SecureRoute path='/users/:id' component={UserEditComponent} routeGuard={UserRouteGuard} redirectToPathWhenFail='/login' />
        <Route />
        <Route />
    </Switch>
    </Router>
```


 - **`RouteGuard`**

    `RouteGuard` is responsible for telling `<SecureRoute>` whether to enter that route or not. `shouldRoute()` is the key to making that happen, this method must return a boolean value in sync mode or return a `Promise<boolean>` or `Observable<boolean>` in async mode. Before the `RouteGuard` finished, no child components will be rendered, which means no real routing will be executed. `RouteGuard` will stop unauthorized users seeing a route altogether.
 
```javascript
export type RouteGuardResultType = boolean | Promise<boolean> | Observable<boolean>

/**
* @export
* @interface RouteGuard
*/
export interface RouteGuard {
    shouldRoute: () => RouteGuardResultType
}
```


## Usage

Here are some `shouldRoute()` example for different situation:
    
- Sync example
```javascript
shouldRoute(): RouteGuardResultType {
    // Sync API call here, and the final return value must be `map` to `boolean` if not
    const resultFromSyncApiCall = true;
    return resultFromSyncApiCall
}
```
    
- Async Promise example
```javascript
async shouldRoute(): RouteGuardResultType {
    // You can use a `Promise` to get
    // the final boolean result 
    return new Promise((resolve, reject) => {
        // Simulate call backend API for checking the authentication and even authorization
        setTimeout(() => {
            resolve(true)
        }, 3000)
    });
}
```
    
- Async Promise example with multiple promises
```javascript
async shouldRoute(): RouteGuardResultType {
    // You can use `Promise.all()` for getting
    // the final boolean result to based on multiple requirements 

    const results = await Promise.all([
        loginUserPromise,
        getUserPermissionPromise,
        getUserDashboardPromise
    ])

    return results[0].user ? true : false
}
```
    
- Async Observable example
```javascript
shouldRoute(): RouteGuardResultType {
    // If use Redux, we can dispatch an action to tell UI that `RouteGuard` is running.
    // This is useful for displaying loading indicators before the `shouldRoute` is complete
    appStore.dispatch(routingActions.executeRouteGuard())

    // Simulate a call to an API to grab the user and permissions
    return Observable.timer(1000)
        .map(n => {
            // When API call done, we need to `map` to `boolean` if not
            return true
        })
        .take(1)
        // If use Redux, then dispatch an action to tell UI that `RouteGuard` is done, can hide 
        // the loading spin right now.
        .do(() => appStore.dispatch(routingActions.executeRouteGuardDone()))
    }

```
    
- Async real world example
```javascript
shouldRoute(): RouteGuardResultType {
    appStore.dispatch(routingActions.executeRouteGuard())

    // Get the entire state to check whether the user is already logged in or not
    const appState: AppState = appStore.getState() as AppState;

    // Already logged in, pass instantly
    if (appState.auth.loginUser && (!appState.auth.loginError || appState.auth.loginError === '')) {
        // We can call any BackEnd APIs to rebuild the entire app state that are needed for the 
        // routed component to be rendered correctly
        //
        // Passed
        return true
    } else {
        // Say for instance a user just opened a URL in a new tab, then we can try to load some 
        // cookie or call some API to load user info. If the API responds successfully, 
        // then the check has passed. From here we rebuild the entire
        // app state for the routed component if needed
        
        return UserService.loadUserStateFromCookie()
            .switchMap(loadedUser => loadedUser ? UserService.loadUserList() : Observable.of(false))
            .do(userList => {
                // Dispatch an action to let Reducer rebuild the state synchronize
                if (userList && typeof(userList) === 'object') {
                    appStore.dispatch(actions.rebuildState(userList))) 
                }
            }
            // Map to boolean result
            .map(userList => userList ? true : false)
            .take(1)
    }
}
```
