/**
 * @author Luke Brandon Farrell
 * @description
 */

/* NPM - Node Package Manage */
import { takeLatest, all } from "redux-saga/effects";
import _snakeCase from "lodash/snakeCase";
import _mapKeys from "lodash/mapKeys";
/* Local Modules */
import { AbstractNetworkSaga } from "./abstract-network-saga";
import { getRequestType } from "./get-request-type";
import { getResponseType } from "./get-response-type";
import { createRequest } from "./create-request";

export function* ReduxNLSaga(baseUrl, file) {
  const sagas = file.map(({ path, method }) => {
    const requestAction = getRequestType(method, path);
    const responseAction = getResponseType(method, path);
    const requestPromise = (baseUrl, payload = {}, meta = {}) =>
      new Promise((resolve, reject) => {
        // Maps our payload and meta to snake case e.g. firstName -> first_name
        const payloadInSnakeCase = _mapKeys(payload, (_, key) =>
          _snakeCase(key)
        );
        const metaInSnakeCase = _mapKeys(meta, (_, key) => _snakeCase(key));
        // Extracts parameters from brackets e.g. "/user/orders/{id}" -> id (only supports a single query parameter)
        const extractedPathParameter = path
          .match(/\{(.+?)\}/g)?.[0]
          ?.replace(/\{|}/g, "");
        // This replaces path parameters with a variable from our 'payload' -> "/user/orders/{id}" -> "/user/orders/35"
        const pathWithParams = path.replace(
          /\{(.+?)\}/g,
          payloadInSnakeCase[extractedPathParameter]
        );
        const url = createRequest.build(pathWithParams, metaInSnakeCase);

        // const payload = _mapValues(
        //   {
        //     amount: value,
        //     source,
        //     use_credits: useCredit,
        //     campaign_id: campaignId,
        //     is_gift: isGift,
        //     gift_name: giftName,
        //     gift_message: giftMessage,
        //     gift_send_date: giftDateTime,
        //     gift_email: giftEmail,
        //     gift_phone: giftPhone
        //   },
        //   value => (value === "" ? null : value)
        // );
        //
        
        createRequest
          .request(baseUrl, method.toLowerCase(), url, payloadInSnakeCase, meta?.headers)
          .then(response => resolve(createRequest.normlzDataResponse(response)))
          .catch(error => reject(error));
      });

    return takeLatest(requestAction, action =>
      AbstractNetworkSaga(action, baseUrl, requestPromise, responseAction)
    );
  });

  yield all(sagas);
}
