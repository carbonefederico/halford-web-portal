const props = {
    "companyId": "A7t8oXIPKEuRAwtO8JUS9lYLvFCTTTGj",
    "regFlowId": "hMF6Ts7D6Woy1uTnauyPnpiPAmAu78mK",
    "loginFlowId": "7f1Pj7NuEVKTkmoZzWmU3NZbHDU46top",
    "trxFlowId" : "pnvRCWzuYzIyqt4MorHzztqZjg2V59T1",
    "subscriptionFlowId" : "CeQRGO08rUFL0Mdhn8VIZfwDqup2tSal",
    "apiKey": "iUCtJ4sYHcyBwOHtKkUbAHjJInyEqkxCsHC6GCcCOqPYtgK2vc1pzc7wvZ6O9JA9CtAGWTX3kwiccLnYXsXhbDgXpmq5g0hfEN6p8WMti4kPm29nrU4LRY54jbOeUPZvO80lxMkOuPqaFVZcKGYHFwQmgivat7L6XqPop4DWp3AEVJoMcI3BTOqrBxrcjJt2o6XtGi3NYAvslFktJlHQPoYdO7rvtzx1Up91KA7g5lgLM8WmqWZYLutxIpk4IqrE"
}

let token;
let skWidget;
let idTokenClaims;

window.onload = async () => {
    console.log("onload");
    document.getElementById("registerButton").addEventListener("click", () => startRegistration());
    document.getElementById("loginButton").addEventListener("click", () => startLogin());
    document.getElementById("eventLink").addEventListener ("click", () => showPage ("event"));
    document.getElementById("homeLink").addEventListener ("click", () => showPage ("home"));
    document.getElementById("moreLink").addEventListener ("click", () => showPage ("more"));
    document.getElementById("event").addEventListener("click", ()=> startTransaction ());
    document.getElementById("more").addEventListener("click", ()=> startSubscription ());

    if (window.location.hash) {
        handleRedirectBack();
    } else {
        await getToken();
        skWidget = document.getElementsByClassName("skWidget")[0];
    }
}

function startTransaction () {
    console.log ("startTransaction");
    let parameters = {
        'userEmail': idTokenClaims.email,
        'eventTitle':  'Les Bleus',
        'cost': '4.00 €'
    }
    showWidget(props.trxFlowId, purchaseCallback, errorCallback, onCloseModal,parameters);
}

function startSubscription () {
    console.log ("startSubscription");
    let parameters = {
        'userEmail': idTokenClaims.email,
        'eventTitle': 'FIFA+ Yearly Subscription',
        'cost': '50.00 €'
    }
    showWidget(props.subscriptionFlowId, subscriptionCallback, errorCallback, onCloseModal,parameters);
}

async function startLogin() {
    console.log ("startLogin");
    showWidget(props.loginFlowId, successCallback, errorCallback, onCloseModal);
}

async function startRegistration() {
    console.log ("startRegistration");
    showWidget(props.regFlowId, successCallback, errorCallback, onCloseModal);
}

async function logout() {
    console.log ("logout");
    updateUI (false);
}

function handleRedirectBack() {
    var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
    var id_token = new URLSearchParams(hash).get('id_token');
    console.log(id_token);
    let decodedToken = decodeJWT(id_token);
    idTokenClaims = decodedToken.payload;
    console.log(idTokenClaims.mail);
    updateUI (true);
    window.history.replaceState({}, document.title, window.location.pathname);
}

async function getToken() {
    console.log("getToken");

    const url = "https://pingsandboxapi.singularkey.com/v1/company/" + props.companyId + "/sdkToken";
    let response = await fetch(url, {
        method: "GET",
        headers: {
            "X-SK-API-KEY": props.apiKey
        }
    });

    token = await response.json();
    console.log(token);
}

async function showWidget(flowId, successCallback, errorCallback, onCloseModal,parameters) {
    console.log("showWidget");
    let widgetConfig = {
        config: {
            method: "runFlow",
            apiRoot: "https://pingsandboxapi.singularkey.com/v1",
            accessToken: token.access_token,
            companyId: props.companyId,
            policyId: flowId,
            parameters: parameters
        },
        useModal: true,
        successCallback,
        errorCallback,
        onCloseModal
    };

    singularkey.skRenderScreen(skWidget, widgetConfig);
}

function successCallback(response) {
    console.log("successCallback");
    singularkey.cleanup(skWidget);
    let decodedToken = decodeJWT(response.id_token);
    idTokenClaims = decodedToken.payload;
    console.log(idTokenClaims);
    updateUI (true);
}

function subscriptionCallback (response) {
    console.log("subscriptionCallback");
    singularkey.cleanup(skWidget);
}

function purchaseCallback (response) {
    console.log("purchaseCallback");
    singularkey.cleanup(skWidget);
    showPage ("player");
}

function errorCallback(error) {
    console.log("errorCallback");
    console.log(error);
    singularkey.cleanup(skWidget);
}

function onCloseModal() {
    console.log("onCloseModal");
    singularkey.cleanup(skWidget)
}

function decodeJWT(Jwt) {
    let parts = Jwt.split('.');
    let header;
    let payload;

    if (parts.length !== 3) {
        throw new Error('Malformed JWT');
    }

    header = JSON.parse(this.base64urlDecodeStr(parts[0]));
    payload = JSON.parse(this.base64urlDecodeStr(parts[1]));

    return {
        header: header,
        payload: payload,
        encoded: {
            header: parts[0],
            payload: parts[1],
            signature: parts[2]
        }
    };
}

function base64urlDecodeStr(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return atob(str);
}

function updateUI (isUserAuthenticated) {
    console.log ("updateUI. Is user authenticated " + isUserAuthenticated);
    
    if (isUserAuthenticated) {
        document.getElementById("username").innerText = getDisplayName (idTokenClaims);
        eachElement(".auth", (e) => e.style.display = "block");
        eachElement(".non-auth", (e) => e.style.display = "none");
    } else {
        document.getElementById("username").innerText = "";
        eachElement(".auth", (e) => e.style.display = "none");
        eachElement(".non-auth", (e) => e.style.display = "block");
    }
}

function getDisplayName (claims) {
    if (claims.firstName) {
        return claims.firstName + " (" + claims.email + ")";
    }

    return claims.email;
}

function showPage (idToShow) {
    hideAll ();
    document.getElementById (idToShow).style.display = "block";
}

function hideAll () {
    console.log ("hideAll");
    document.querySelectorAll (".home-image").forEach ((e) => e.style.display = "none");
}

function eachElement (selector, fn) {
    for (let e of document.querySelectorAll(selector)) {
      fn(e);
    }
  }