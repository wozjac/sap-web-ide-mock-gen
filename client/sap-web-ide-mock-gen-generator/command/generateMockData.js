define({
    execute: function () {
        return this.context.service.generator.generateMockData();
    },

    isAvailable: function () {
        return true;
    },

    isEnabled: function () {
        return true;
    }
});