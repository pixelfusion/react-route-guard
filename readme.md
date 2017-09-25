# React Route Guard

It's based on `react-router-dom`, added the route guard functionality on top of it, make it more easy to control the security layer on routing.

## 1. Install

```javascript
yarn add react-route-guard
```
You don't need to install `@types/react-route-guard`, as it's written by `TypeScript`, npm module already has `index.d.ts` there.
</br>

---

</br>

## 2. Concepts quick walkthrough

- **`SecureRoute`**

    `<SecureRoute>` works like same with `<Route`>, it means that, basically, you can use it as a normal `<Route`>, but you can use extra props to enable the `RouteGuard` feature when doing routing, Several things will happen after enable `RouteGuard`:

    - There is NO any component DOM will be created after `<SecureRoute>` be created

    - Inside `SecureRoute.componentDidMount()`, it will run `RouteGuard.shouldRoute()`, and will wait for it finish, after that, `SecureRoute` update the state. `RouteGuard.shouldRoute()` can be return a Sync `boolean` or Async of `Promise<boolean>` or `Observable<boolean>` .

    - Inside `SecureRoute.render()`, only will render the real route component when route guard IS FINISHED, and will render `<Redirect to={this.props.redirectToPathWhenFail | '/'} />` if route guard fail to pass.


    here is the example how to use it:

    ```xml
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

 </br></br>

 ---
</br></br>



 - **`RouteGuard`**

    `RouteGuard` is responsible for telling `<SecureRoute>` that can be routed to or not, `shouldRoute()` is the key to making that happen, this method MUST return a boolean value in sync mode or return a `Promise<boolean>` or `Observable<boolean>` in async mode, before the `RouteGuard` finished, HAS NO ANY component will be rendered, means no real routing will be executed, `RouteGuard` is the security guard for the resource to be protected.
 
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

    Hers are some `shouldRoute()` example for different situation:
    
    ```javascript
    // ------------------------------ `shouldRoute` Sync example --------------------------
    shouldRoute(): RouteGuardResultType {
        // Sync API call here, and the final return value must be `map` to `boolean` if not
        const resultFromSyncApiCall = true;
        return resultFromSyncApiCall
    }
    ```

    ```javascript
    ------------------------------ `shouldRoute` Async Promise example --------------------------
    async shouldRoute(): RouteGuardResultType {
        //
        // You can call any Promise here, even do complex call by using `promise.all()`, for getting
        // the final boolean result to tell route should pass or not, e.g.
        //
        // const results = await Promise.all([
        //     loginUserPromise,
        //     getUserPermissionPromise,
        //     getUserDashboardPromise
        // ])
        // 
        // return results[0].user ? true : false
        //
        return new Promise((resolve, reject) => {
            // Simulate call backend API for checking the authentication and even authorization
            setTimeout(() => {
                resolve(true)
            }, 3000)
        });
    }
    ```
    
    ```javascript
    ------------------------------ `shouldRoute` Async Observable example --------------------------
    shouldRoute(): RouteGuardResultType {
        // If use Redux, we can dispatch an action to tell UI that `RouteGuard` is running, show the
        // loading spin there (before I done).
        appStore.dispatch(routingActions.executeRouteGuard())
    
        // Simualte to call Backend APIs to grap the user and permissions
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

    ```javascript
    ------------------------------ `shouldRoute` Async Real life example -------------------------- 
    shouldRoute(): RouteGuardResultType {
        // Tell UI that `RouteGuard` is running, show the loading spin there (before I done).
        appStore.dispatch(routingActions.executeRouteGuard())
        
        // Get the entire state for checking user already login or not
        const appState: AppState = appStore.getState() as AppState;

        // Already login, pass directly
        if (appState.auth.loginUser && (!appState.auth.loginError || appState.auth.loginError === '')) {
            //
            // At here, we can call any BackEnd APIs to rebuild the entire App State which need for the 
            // routed component to be rendered correctly !!!
            //
            // Passed !
            return true
        } else {
            //
            // At here, maybe user just `copy & paste` URL to new tab directly, then we can TRY TO load some 
            // cookie or call some API to load user info, if load success, then `Passed` (and rebuild the entire
            // App State which need for the routed component if needed); otherwise, `Fail` !!!
            //
            // retrun XXXX-Servie.loadUserStateFromCookie()
            //     .switchMap(loadedUser => loadedUser ? YYYY-Service.loadUserList() : Observable.of(false))
            //     .do(userList => {
            //         // Dispatch an action to let Reducer rebuild the state synchronize
            //         if (userList && typeof(userList) === 'object') {
            //             appStore.dispatch(zzzz-actions.rebuildState(userList))) 
            //         }
            //     }
            //     // Map to boolean result
            //     .map(userList => userList ? true : false)
            //     .take(1)
            return false
        }
    }
    ```