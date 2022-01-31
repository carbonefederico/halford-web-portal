const props = {
    "companyId": "6lNuL5aD3AKeqno6w16MgV9o5ITgwE4B",
    "loginPolicyId": "Sl0bBKViVsbUr3Fg0rwD52pPxNtdPs4m",
    "trxpolicyId": "pnvRCWzuYzIyqt4MorHzztqZjg2V59T1",
    "apiKey": "2eGHvUqMaHeKjfecf88CsFpmRjIXMosi7KuY4cZ4PWktwEdlXQw1lRKaYzKmByylU9ivUvkpJwwGifrW5I6aO0EaznKJHKAfXBhCBMNHcOdm5HfiXZYwjB2Qe2EQtnSVpGa2MQW1v6lxkXDxrlAQvOByWIFebVar2I0vfI5edWFpDnpji0HiMHa0Ocez8JqGBDe098OLj6W90RtwgMLVU7WrjlHd1UqlkfKdfnkcfNREE0NGPbHrIqXMpz0ZR2ea"
}

let token;
let skWidget;
let idTokenClaims;

window.onload = async () => {
    console.log("onload");
    document.getElementById("loginButton").addEventListener("click", () => startLogin());
    document.getElementById("logo-img").addEventListener("click", () => logout())
    if (window.location.hash) {
        handleRedirectBack();
    } else {
        await getToken();
        skWidget = document.getElementsByClassName("skWidget")[0];
    }
}

async function startLogin() {
    console.log("startLogin");
    showWidget(props.loginPolicyId, successCallback, errorCallback, onCloseModal);
}

async function logout() {
    console.log("logout");
    updateUI(false);
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

async function showWidget(policyId, successCallback, errorCallback, onCloseModal, parameters) {
    console.log("showWidget");
    let widgetConfig = {
        config: {
            method: "runFlow",
            apiRoot: "https://pingsandboxapi.singularkey.com/v1",
            accessToken: token.access_token,
            companyId: props.companyId,
            policyId: policyId,
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
    updateUI(true);
}

function subscriptionCallback(response) {
    console.log("subscriptionCallback");
    singularkey.cleanup(skWidget);
}

function purchaseCallback(response) {
    console.log("purchaseCallback");
    singularkey.cleanup(skWidget);
    showPage("player");
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

function updateUI(isUserAuthenticated) {
    console.log("updateUI. Is user authenticated " + isUserAuthenticated);

    if (isUserAuthenticated) {
        document.getElementById("username").innerText = getDisplayName(idTokenClaims);
        eachElement(".auth", (e) => e.style.display = "block");
        eachElement(".non-auth", (e) => e.style.display = "none");
    } else {
        document.getElementById("username").innerText = "Account";
        eachElement(".auth", (e) => e.style.display = "none");
        eachElement(".non-auth", (e) => e.style.display = "block");
    }
}

function getDisplayName(claims) {
    if (claims.firstName) {
        return claims.firstName;
    }

    return claims.email;
}

function showPage(idToShow) {
    hideAll();
    document.getElementById(idToShow).style.display = "block";
}

function hideAll() {
    console.log("hideAll");
    document.querySelectorAll(".home-image").forEach((e) => e.style.display = "none");
}

function eachElement(selector, fn) {
    for (let e of document.querySelectorAll(selector)) {
        fn(e);
    }
}