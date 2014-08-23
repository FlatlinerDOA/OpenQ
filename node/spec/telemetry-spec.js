/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var IPricingStructure = (function () {
    function IPricingStructure() {
    }
    return IPricingStructure;
})();

var gigabyte = 1024 * 1024 * 1024;
var terabyte = gigabyte * 1024;
var AmazonPricing = (function () {
    function AmazonPricing(machineSize, reducedRedundancy) {
        if (typeof machineSize === "undefined") { machineSize = 'm1.small'; }
        if (typeof reducedRedundancy === "undefined") { reducedRedundancy = false; }
        this.machineSizes = {
            "m1.small": {
                hourlyCost: 0.08,
                kilobytesPerSecond: 5000
            },
            "m1.medium": {
                hourlyCost: 0.16,
                kilobytesPerSecond: 15000
            },
            "m1.large": {
                hourlyCost: 0.320,
                kilobytesPerSecond: 30000
            }
        };
        this.runningCosts = [];
        for (var i = 1; i < 100; i++) {
            this.runningCosts.push(this.calculateRunningCost(machineSize, i));
        }

        if (!reducedRedundancy) {
            this.storageCosts = [
                { tier: 1024, amount: 0.095 },
                { tier: 1024 * 49, amount: 0.080 },
                { tier: 1024 * 450, amount: 0.070 },
                { tier: 1024 * 500, amount: 0.065 },
                { tier: 1024 * 450, amount: 0.070 }
            ];
        } else {
            this.storageCosts = [
                { tier: 1024, amount: 0.076 },
                { tier: 1024 * 49, amount: 0.064 },
                { tier: 1024 * 450, amount: 0.056 },
                { tier: 1024 * 500, amount: 0.052 },
                { tier: 1024 * 450, amount: 0.070 },
                { tier: 1024 * 450, amount: 0.070 }
            ];
        }

        this.transferCosts = [
            { tier: 1, amount: 0 },
            { tier: 1024 * 10, amount: 0.19 },
            { tier: 1024 * 40, amount: 0.15 },
            { tier: 1024 * 100, amount: 0.13 },
            { tier: 1024 * 350, amount: 0.12 }
        ];
    }
    AmazonPricing.prototype.hourlyMachineCost = function (machineSize) {
        return this.machineSizes[machineSize].hourlyCost;
    };

    AmazonPricing.prototype.calculateRunningCost = function (machineSize, instanceCount) {
        var kilobytesPerSecond = this.machineSizes[machineSize].kilobytesPerSecond;
        var monthlyCost = (this.hourlyMachineCost(machineSize) * 24 * 365.25) / 12;
        var kilobytesPerMonth = (kilobytesPerSecond * 3600 * 24 * 365.25) / 12;
        return {
            tier: ((kilobytesPerMonth * 1024) / gigabyte) * instanceCount,
            amount: monthlyCost * instanceCount
        };
    };
    return AmazonPricing;
})();

var AmazonSpotPricing = (function (_super) {
    __extends(AmazonSpotPricing, _super);
    function AmazonSpotPricing(machineSize, reducedRedundancy) {
        if (typeof machineSize === "undefined") { machineSize = 'm1.small'; }
        if (typeof reducedRedundancy === "undefined") { reducedRedundancy = false; }
        _super.call(this, machineSize, reducedRedundancy);
        this.spotMachineSizes = {
            "m1.small": {
                hourlyCost: 0.08,
                kilobytesPerSecond: 5000
            },
            "m1.medium": {
                hourlyCost: 0.16,
                kilobytesPerSecond: 15000
            },
            "m1.large": {
                hourlyCost: 0.320,
                kilobytesPerSecond: 30000
            }
        };
    }
    AmazonSpotPricing.prototype.hourlyMachineCost = function (machineSize) {
        return this.spotMachineSizes[machineSize].hourlyCost;
    };
    return AmazonSpotPricing;
})(AmazonPricing);

var CostCalculator = (function () {
    function CostCalculator(pricing) {
        this.pricing = pricing;
        this.messageTransferOverheadBytes = 20;
    }
    CostCalculator.prototype.selectTier = function (tiers, gb) {
        var tier = tiers.sort(function (a, b) {
            return a.tier < b.tier ? -1 : 1;
        }).filter(function (f) {
            return gb < f.tier;
        })[0];
        return tier;
    };

    CostCalculator.prototype.calculateCosts = function (data) {
        var result = {
            runningCost: this.calculateRunningCost(data),
            transferCost: this.calculateTransferCost(data),
            storageCost: this.calculateStorageCost(data),
            totalCost: 0
        };
        result.totalCost = result.runningCost + result.transferCost + result.storageCost;
        return result;
    };

    CostCalculator.prototype.calculateRunningCost = function (data) {
        var _this = this;
        var totalGigabytes = 0;
        data.forEach(function (d) {
            var gigabytes = _this.totalBytesTransferred(d) / gigabyte;
            totalGigabytes += gigabytes;
        });
        var tier = this.selectTier(this.pricing.runningCosts, totalGigabytes);
        console.log('running costs tier', totalGigabytes, tier);
        return tier.amount;
    };

    CostCalculator.prototype.calculateTransferCost = function (data) {
        var _this = this;
        return this.calculateCostPerMonth(data, this.pricing.transferCosts, function (d) {
            return _this.totalBytesTransferred(d) / gigabyte;
        });
    };

    CostCalculator.prototype.calculateStorageCost = function (data) {
        var _this = this;
        return this.calculateCostPerMonth(data, this.pricing.storageCosts, function (d) {
            return _this.totalBytesStored(d) / gigabyte;
        });
    };

    CostCalculator.prototype.calculateCostPerMonth = function (data, tiers, calculateGigabytes) {
        var totalGigabytes = 0;
        data.forEach(function (d) {
            var gigabytes = calculateGigabytes(d);
            totalGigabytes += gigabytes;
        });

        var tier = this.selectTier(tiers, totalGigabytes);
        if (!tier) {
            throw new Error('Could not select tier');
        }
        console.log('select tier', totalGigabytes, tier);

        return totalGigabytes * tier.amount;
    };

    CostCalculator.prototype.totalBytesStored = function (telemetry) {
        return telemetry.bytesWritten + (telemetry.localSubscribers * telemetry.messageCount * 64);
    };

    CostCalculator.prototype.totalBytesTransferred = function (telemetry) {
        return (telemetry.bytesWritten + this.messageTransferOverheadBytes) + ((telemetry.bytesWritten + this.messageTransferOverheadBytes) * telemetry.remoteSubscribers);
    };
    return CostCalculator;
})();

describe('Given twitter\'s 340 million 500byte messages per day, running on AWS, with an average of 126 local and 1 remote subscribers per queue', function () {
    var calc = new CostCalculator(new AmazonPricing());
    var cost = calc.calculateCosts([{
            bytesWritten: 340000000 * 30 * 500,
            messageCount: 340000000,
            localSubscribers: 126,
            remoteSubscribers: 1
        }]);

    it('Then the cost is less than $3,000 per month', function () {
        console.log('Total Cost:', cost);
        expect(cost.totalCost).toBeLessThan(3000);
    });
});
//# sourceMappingURL=telemetry-spec.js.map
