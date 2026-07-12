// @ts-nocheck
import { getContext } from '/scripts/st-context.js'

const {
    macros,
    SlashCommand, SlashCommandParser,
    SlashCommandNamedArgument, SlashCommandArgument,
    ARGUMENT_TYPE,
    extensionSettings, saveSettingsDebounced, getRequestHeaders
} = SillyTavern.getContext()

/**
 * @typedef {import('/scripts/slash-commands/SlashCommand').NamedArguments} NamedArguments
 * @typedef {import('/scripts/slash-commands/SlashCommand').UnnamedArguments} UnnamedArguments
 *
 * @typedef {import('/scripts/macros/macro-system').MacroExecutionContext} MacroExecutionContext
 */

/**
 * Intialize the extension settings.
 */
async function initSettings() {
    if (!extensionSettings.discordStats) {
        extensionSettings.discordStats = {
            payload: {
                username: '',
                data: {
                    dynamic: []
                }
            }
        };

        saveSettingsDebounced();
    }
}

/**
 * Send an API request to update the user's Discord widget.
 *
 * @param {NamedArguments} _ - Named arguments
 * @param {UnnamedArguments} __ - Unnamed arguments
 */
async function updateWidget(_, __) {
    const response = await fetch('/api/plugins/discord-stats/update', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(extensionSettings.discordStats.payload)
    });

    if (!response.ok) {
        throw new Error(`Failed to update widget: ${response.status} ${response.statusText}`);
    }
}

/**
 * Save widget data to the extension settings for the user's Discord widget.
 *
 * @param {NamedArguments} args - Named arguments
 * @param {UnnamedArguments} value - Unnamed arguments
 */
async function saveWidgetDataCMD(args, value) {
    const valType = Number(args.type);
    const valName = args.name;
    const valValue = value;

    /** @type {String[]} */
    const dataKeys = extensionSettings.discordStats.payload.data.dynamic.map(x => x.name);

    if (dataKeys.includes(valName)) {
        extensionSettings.discordStats.payload.data.dynamic[dataKeys.indexOf(valName)] = {
            type: valType,
            name: valName,
            value: valValue
        };

        saveSettingsDebounced();
    } else {
        extensionSettings.discordStats.payload.data.dynamic.push({
            type: valType,
            name: valName,
            value: valValue
        });

        saveSettingsDebounced();
    }
}


/**
 *
 * @param {MacroExecutionContext} macroEnv
 */
function saveWidgetDataMacro(macroCtx) {

}

/**
 * Clear all widget data for the user's Discord widget.
 *
 * @param {NamedArguments} _ - Named arguments
 * @param {UnnamedArguments} __ - Unnamed arguments
 */
async function clearWidgetDataCMD(_, __) {
    extensionSettings.discordStats.payload.data.dynamic = [];

    saveSettingsDebounced();
}

/**
 * Set the username for the Discord widget payload.
 *
 * @param {NamedArguments} _ - Named arguments
 * @param {UnnamedArguments} value - Unnamed arguments
 */
async function setWidgetUsernameCMD(_, value) {
    extensionSettings.discordStats.payload.username = value;

    saveSettingsDebounced();
}

/**
 * Initialize the widget slash commands.
 */
async function initWidgetCMDs() {
    /**
     * update: Update the Discord widget with the current saved payload data.
     */
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'discordStats-update',
        callback: updateWidget,
        namedArgumentList: [],
        unnamedArgumentList: [],
        helpString: 'Update the Discord widget with the current saved payload data.',
    }));

    /**
     * save-data: Save the current widget data to the widget payload.
     */
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'discordStats-save-data',
        callback: saveWidgetDataCMD,
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'type',
                description: 'The enum value of the datatype of the data to save to the widget payload.',
                typeList: [ARGUMENT_TYPE.NUMBER],
                isRequired: true,
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'name',
                description: 'The name of the data to save to the widget payload.',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'The data to save to the widget payload.',
                typeList: [ARGUMENT_TYPE.STRING, ARGUMENT_TYPE.NUMBER],
                isRequired: true,
            }),
        ],
        splitUnnamedArgument: false,
        helpString: 'Save a named piece of data to the widget payload.',
    }));

    /**
     * clear-data: Clear all saved data from the widget payload.
     */
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'discordStats-clear-data',
        callback: clearWidgetDataCMD,
        namedArgumentList: [],
        unnamedArgumentList: [],
        helpString: 'Clear all saved data from the widget payload.',
    }));

    /**
     * set-username: Set the username for the widget payload.
     */
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'discordStats-set-username',
        callback: setWidgetUsernameCMD,
        namedArgumentList: [],
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'The username to set for the widget payload.',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        splitUnnamedArgument: false,
        helpString: 'Set the username for the widget payload.',
    }));
}

initSettings();
initWidgetCMDs();
