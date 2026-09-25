import $ from "jquery";

const TOKEN_KEY = "easybusy_token";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function buildHeaders(extraHeaders = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function createApiError(jqXHR, textStatus, errorThrown) {
  const message =
    jqXHR.responseJSON?.message ||
    errorThrown ||
    (textStatus === "timeout" ? "The server took too long to respond." : "Request failed.");
  const error = new Error(message);

  // Keep one stable error shape so every View can display the server's
  // validation message without knowing how the Ajax request is implemented.
  error.response = {
    data: jqXHR.responseJSON,
    status: jqXHR.status,
  };
  error.request = jqXHR;

  return error;
}

function request(method, path, config = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  const requestData = hasBody ? config.data : config.params;

  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${API_BASE_URL}${path}`,
      method,
      data: hasBody && requestData !== undefined
        ? JSON.stringify(requestData)
        : requestData,
      processData: !hasBody,
      contentType: hasBody ? "application/json; charset=UTF-8" : undefined,
      dataType: "json",
      timeout: 10000,
      headers: buildHeaders(config.headers),
    })
      .done((data, _textStatus, jqXHR) => {
        resolve({ data, status: jqXHR.status });
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        reject(createApiError(jqXHR, textStatus, errorThrown));
      });
  });
}

const api = {
  get(path, config = {}) {
    return request("GET", path, config);
  },
  post(path, data, config = {}) {
    return request("POST", path, { ...config, data });
  },
  put(path, data, config = {}) {
    return request("PUT", path, { ...config, data });
  },
  patch(path, data, config = {}) {
    return request("PATCH", path, { ...config, data });
  },
  delete(path, config = {}) {
    return request("DELETE", path, config);
  },
};

export function getApiErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

export { api, TOKEN_KEY };
