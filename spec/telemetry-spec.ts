/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

interface ITelemetry {
    bytesWritten: number;
    messageCount: number;
    localSubscribers: number;
    remoteSubscribers: number;
}

interface ICostPerGigabyteMonth {
    tier: number;
    amount: number;
}

class IPricingStructure {
    runningCosts: ICostPerGigabyteMonth[];
    storageCosts: ICostPerGigabyteMonth[];
    transferCosts: ICostPerGigabyteMonth[];
}

var gigabyte = 1024 * 1024 * 1024;
var terabyte = gigabyte * 1024;
class AmazonPricing implements IPricingStructure {
    runningCosts: ICostPerGigabyteMonth[];
    storageCosts: ICostPerGigabyteMonth[];
    transferCosts: ICostPerGigabyteMonth[];

    machineSizes = {
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

    constructor(machineSize: string = 'm1.small', reducedRedundancy = false) {
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

    hourlyMachineCost(machineSize: string) {
        return this.machineSizes[machineSize].hourlyCost;
    }

    calculateRunningCost(machineSize: string, instanceCount: number) {
        var kilobytesPerSecond = this.machineSizes[machineSize].kilobytesPerSecond;
        var monthlyCost = (this.hourlyMachineCost(machineSize) * 24 * 365.25) / 12;
        var kilobytesPerMonth = (kilobytesPerSecond * 3600 * 24 * 365.25) / 12;
        return {
            tier: ((kilobytesPerMonth * 1024) / gigabyte) * instanceCount,
            amount: monthlyCost * instanceCount
        };
    }
}

class AmazonSpotPricing extends AmazonPricing {
    spotMachineSizes = {
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

    constructor(machineSize: string = 'm1.small', reducedRedundancy = false) {
        super(machineSize, reducedRedundancy);
    }

    hourlyMachineCost(machineSize: string) {
        return this.spotMachineSizes[machineSize].hourlyCost;
    }
}


class CostCalculator {
    messageTransferOverheadBytes = 20;

    constructor(public pricing: IPricingStructure) {
    }

    selectTier(tiers: ICostPerGigabyteMonth[], gb: number) {
        var tier = tiers.sort((a, b) => a.tier < b.tier ? -1 : 1).filter(f => gb < f.tier)[0];
        return tier;
    }

    calculateCosts(data: ITelemetry[]) {
        var result = {
            runningCost: this.calculateRunningCost(data),
            transferCost: this.calculateTransferCost(data),
            storageCost: this.calculateStorageCost(data),
            totalCost: 0
        };
        result.totalCost = result.runningCost + result.transferCost + result.storageCost;
        return result;
    }

    calculateRunningCost(data: ITelemetry[]) {
        var totalGigabytes = 0;
        data.forEach(d => {
            var gigabytes = this.totalBytesTransferred(d) / gigabyte;
            totalGigabytes += gigabytes;
        });
        var tier = this.selectTier(this.pricing.runningCosts, totalGigabytes);
        console.log('running costs tier', totalGigabytes, tier);
        return tier.amount;
    }

    calculateTransferCost(data: ITelemetry[]) {
        return this.calculateCostPerMonth(data, this.pricing.transferCosts, d => this.totalBytesTransferred(d) / gigabyte);
    }

    calculateStorageCost(data: ITelemetry[]) {
        return this.calculateCostPerMonth(data, this.pricing.storageCosts, d => this.totalBytesStored(d) / gigabyte);
    }

    calculateCostPerMonth(data: ITelemetry[], tiers: ICostPerGigabyteMonth[], calculateGigabytes:(d:ITelemetry) => number) {
        var totalGigabytes = 0;
        data.forEach(d => {
            var gigabytes = calculateGigabytes(d);
            totalGigabytes += gigabytes;
        });

        var tier = this.selectTier(tiers, totalGigabytes);
        if (!tier) {
            throw new Error('Could not select tier');
        }
        console.log('select tier', totalGigabytes, tier);

        return totalGigabytes * tier.amount;
    }

    private totalBytesStored(telemetry: ITelemetry) {
        return telemetry.bytesWritten + (telemetry.localSubscribers * telemetry.messageCount * 64);
    }

    private totalBytesTransferred(telemetry: ITelemetry) {
        return (telemetry.bytesWritten + this.messageTransferOverheadBytes) + ((telemetry.bytesWritten + this.messageTransferOverheadBytes) * telemetry.remoteSubscribers); 
    }
}

describe('Given twitter\'s 340 million 500byte messages per day, running on AWS, with an average of 126 local and 1 remote subscribers per queue', () => {
    var calc = new CostCalculator(new AmazonPricing());
    var cost = calc.calculateCosts([{
        bytesWritten: 340000000 * 30 * 500,
        messageCount: 340000000,
        localSubscribers: 126,
        remoteSubscribers: 1
    }]);

    it('Then the cost is less than $3,000 per month', () => {
        console.log('Total Cost:', cost);
        expect(cost.totalCost).toBeLessThan(3000);
    });
});