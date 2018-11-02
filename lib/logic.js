/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry */

'use strict';
/**
 * Process a property that is held for sale
 * @param {org.kindlebit.com.RegisterPropertyForSale} propertyForSale the property to be sold
 * @transaction
 */
async function onRegisterPropertyForSale(propertyForSale) {   // eslint-disable-line no-unused-vars
    console.log('### onRegisterPropertyForSale ' + propertyForSale.toString());
    propertyForSale.title.forSale = true;
    propertyForSale.title.state = 'FOR_SALE';

    const registry = await getAssetRegistry('org.kindlebit.com.LandTitle');
    await registry.update(propertyForSale.title);
}


/**
 * Make an Offer for a VehicleListing
 * @param {org.kindlebit.com.Offer} offer - the offer
 * @transaction
 */
async function makeOffer(offer) {  // eslint-disable-line no-unused-vars
    let listing = offer.listing;
    if (!listing.forSale) {
        throw new Error('Listing is not FOR SALE');
    }
    if (!listing.offers) {
        listing.offers = [];
    }
    listing.offers.push(offer);

    // save the vehicle listing
    const vehicleListingRegistry = await getAssetRegistry('org.kindlebit.com.LandTitle');
    await vehicleListingRegistry.update(listing);
}


