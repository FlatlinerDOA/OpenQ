var SignupFormViewModel = (function () {
    function SignupFormViewModel() {
        var _this = this;
        this.template = 'SignupFormView';
        this.title = 'Signup an OpenQ account';
        this.username = ko.observable('');
        this.password = ko.observable('');
        this.isUsernameAvailable = ko.observable(false);
        this.showAvailableIndicator = ko.computed(function () {
            return _this.username() != '';
        });

        this.showPasswordIndicator = ko.computed(function () {
            return _this.password() != '';
        });

        this.passwordStrength = ko.computed(function () {
            if (_this.password().length <= 6) {
                return 0;
            }

            if (_this.password().length <= 12) {
                return 1;
            }

            return 2;
        });

        this.passwordStrengthLabel = ko.computed(function () {
            if (_this.passwordStrength() === 2) {
                return "Yeah! Alright now we're talking secure!";
            }

            if (_this.passwordStrength() === 1) {
                return "Come on! You can do better than that!";
            }

            return "Dude, that password is weak!";
        });

        this.passwordStrengthClass = ko.computed(function () {
            if (_this.passwordStrength() === 2) {
                return "label success";
            }

            if (_this.passwordStrength() === 1) {
                return "label warning";
            }

            return "label important";
        });
    }
    SignupFormViewModel.prototype.create = function () {
        var payload = ko.toJSON({ username: this.username(), password: this.password() });
        $.ajax('api/signup', {
            data: payload,
            type: 'POST',
            accept: 'text/html',
            contentType: 'application/json'
        }).fail(function () {
        }).done(function () {
            var form = new HomeViewModel();
            Navigation.show(form);
        });
    };
    return SignupFormViewModel;
})();
