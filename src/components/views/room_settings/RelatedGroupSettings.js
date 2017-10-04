/*
Copyright 2017 New Vector Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// import Promise from 'bluebird';
import React from 'react';
import {MatrixEvent, MatrixClient} from 'matrix-js-sdk';
// var ObjectUtils = require("../../../ObjectUtils");
// var MatrixClientPeg = require('../../../MatrixClientPeg');
import sdk from '../../../index';
import { _t } from '../../../languageHandler';
import Modal from '../../../Modal';

const GROUP_ID_REGEX = /\+\S+\:\S+/;

module.exports = React.createClass({
    displayName: 'RelatedGroupSettings',

    propTypes: {
        roomId: React.PropTypes.string.isRequired,
        canSetRelatedRooms: React.PropTypes.bool.isRequired,
        relatedGroupsEvent: React.PropTypes.instanceOf(MatrixEvent),
    },

    contextTypes: {
        matrixClient: React.PropTypes.instanceOf(MatrixClient),
    },

    getDefaultProps: function() {
        return {
            canSetRelatedRooms: false,
        };
    },

    getInitialState: function() {
        return {
            newGroupsList: this.props.relatedGroupsEvent ?
                (this.props.relatedGroupsEvent.getContent().groups || []) : [],
            newGroupId: null,
        };
    },

    saveSettings: function() {
        return this.context.matrixClient.sendStateEvent(
            this.props.roomId,
            'm.room.related_groups',
            {
                groups: this.state.newGroupsList,
            },
            '',
        );
    },

    validateGroupId: function(groupId) {
        const localDomain = this.context.matrixClient.getDomain();
        if (!GROUP_ID_REGEX.test(groupId) || !groupId.endsWith(localDomain)) {
            const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
            Modal.createTrackedDialog('Invalid related group ID', '', ErrorDialog, {
                title: _t('Invalid group ID'),
                description: _t('\'%(groupId)s\' is not a valid group ID', { groupId }),
            });
            return false;
        }
        return true;
    },

    onNewGroupChanged: function(newGroupId) {
        this.setState({ newGroupId });
    },

    onGroupAdded: function(groupId) {
        if (groupId.length === 0 || !this.validateGroupId(groupId)) {
            return;
        }
        this.setState({
            newGroupsList: this.state.newGroupsList.concat([groupId]),
            newGroupId: '',
        });
    },

    onGroupEdited: function(groupId, index) {
        if (groupId.length === 0 || !this.validateGroupId(groupId)) {
            return;
        }
        this.setState({
            newGroupsList: Object.assign(this.state.newGroupsList, {[index]: groupId}),
        });
    },

    onGroupDeleted: function(index) {
        const newGroupsList = this.state.newGroupsList.slice();
        newGroupsList.splice(index, 1),
        this.setState({ newGroupsList });
    },

    render: function() {
        const localDomain = this.context.matrixClient.getDomain();
        const EditableItemList = sdk.getComponent('elements.EditableItemList');
        console.info(this.state.newGroupsList);
        return (<div>
            <h3>{ _t('Related Groups') }</h3>
            <EditableItemList
                items={this.state.newGroupsList}
                className={"mx_RelatedGroupSettings"}
                newItem={this.state.newGroupId}
                onNewItemChanged={this.onNewGroupChanged}
                onItemAdded={this.onGroupAdded}
                onItemEdited={this.onGroupEdited}
                onItemRemoved={this.onGroupDeleted}
                itemsLabel={_t('Related groups for this room:')}
                noItemsLabel={_t('This room has no related groups')}
                placeholder={_t(
                    'New group ID (e.g. +foo:%(localDomain)s)', {localDomain},
                )}
            />
        </div>);
    },
});