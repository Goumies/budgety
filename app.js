//------------- Budget controller -------------
var budgetController = (function IIFE() {

    // By those are the same, but they will differ later
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calculatePercentage = function (totalIncome) {

        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
            // console.log(this.value, totalIncome, this.percentage);
        } else {
            this.percentage = -1;
        }

    };

    Expense.prototype.getPercentage = function () {
        return this.percentage;
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description
        this.value = value;
    };

    var Limit = function (type, value) {
        this.type = type;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;

        data.allItems[type].forEach(function (current) {
            sum += current.value;
        });

        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            expense: [],
            income: []
        },
        totals: {
            expense: 0,
            income: 0
        },
        budget: 0,
        percentage: -1,
        limit: -1
    };

    return {
        addItem: function (itemType, itemDescription, itemValue) {
            var newItem, id;

            /*
            ID = last id + 1 since we can delete item later
            [1, 2, 3, 4], next id = 5
            [1, 3, 4, 5], next id = 6/
            */

            // Create new ID
            if (data.allItems[itemType].length > 0) {
                id = data.allItems[itemType][data.allItems[itemType].length - 1].id + 1;
            } else {
                id = 0;
            };

            // Create new item based on expense or income type
            if (itemType === 'expense') {
                newItem = new Expense(id, itemDescription, itemValue);
            } else if (itemType === 'income') {
                newItem = new Income(id, itemDescription, itemValue);
            }

            // Push it to our data structure
            data.allItems[itemType].push(newItem);

            // Return the new element
            return newItem;
        },

        deleteItem: function (type, id) {
            var ids, index;
            ids = data.allItems[type].map(function (current) {
                return current.id;
            });
            /*
                .map() alaways return an array
                here, it returns all the existing ids
                [1 2 4 6 8]
                id = 6
                
            */

            index = ids.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            };

            // [1 2 4 8]

        },

        calculateBudget: function () {

            // 1. calculate total income and expenses
            calculateTotal('expense');
            calculateTotal('income');

            // 2. calculate the budget = income - expenses
            data.budget = data.totals.income - data.totals.expense;

            // 3. calculate the percentage of income spent
            if (data.totals.income > 0) {
                // console.log('data.totals.income =', data.totals.income);
                data.percentage = Math.round((data.totals.expense / data.totals.income) * 100);
            } else {
                data.percentage = -1;
            };

        },

        calculatePercentages: function () {

            /*
                expences
                a = 20
                b = 10
                c = 40
                incomes = 100
                a = 20 / 100 = 20% of incomes
                b = 10%
                c = 40%
            */

            data.allItems.expense.forEach(function (current) {
                current.calculatePercentage(data.totals.income);
            });
        },

        addLimit: function (limitType, limitValue) {
            var newLimit;
            if (limitValue > 0) {
                data.limit = {};
                data.limit.type = limitType;
                data.limit.value = limitValue;
                newLimit = new Limit(limitType, limitValue);
            };
            // Returning the new limit
            return newLimit;
        },

        getPercentages: function () {
            var allPercentages = data.allItems.expense.map(function (current) {
                return current.getPercentage();
            });
            return allPercentages;
        },

        getBudget: function () {
            return {
                budget: data.budget,
                totalIncome: data.totals.income,
                totalExpense: data.totals.expense,
                percentage: data.percentage
            }
        },

        testing: function () {
            console.log(data);

        }

    }

})();


//------------- UI controller -------------
var UIController = (function IIFE() {

    // Refactoring the querySelector's strings
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        limitInputType: '.limit__type',
        limitInputValue: '.limit__value',
        budgetLimitValue: '.budget__limit--value',
        limitInputSymbol: '.budget__limit--symbol',
        limitInputBtn: '.limit__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expencesPercentageLabels: '.item__percentage',
        datelabel: '.budget__title--month'
    };

    var formatNumber = function (number, type) {
        var numberSplit, integer, decimal, sign;
        /*
            + or - before number
            Exactly 2 decimal points
            Comma separating the thousands
            
            2310.4567 -> + 2,310.46
            2000 -> + 2,000.00
            
        */

        // Absolute number (no sign)
        number = Math.abs(number);

        // Decimal part
        number = number.toFixed(2); // method of the Number prototype (not Math)

        // comma separation
        // splitting integer and decimals
        numberSplit = number.split('.');
        integer = numberSplit[0];

        // first part
        if (integer.length > 3) {
            integer = integer.substring(0, integer.length - 3) + ',' + integer.substring(integer.length - 3, integer.length);
            // .substring(start position, end position)
            // input 23510 --> 23 + , + 510 --> output 23,510
        };

        decimal = numberSplit[1];

        /*
            basic way
            type === 'expense' ? sign = '-' : sign = '+';
            return sign + ' ' + integer + '.' + decimal;
        */

        return (type === 'expense' ? '-' : '+') + ' ' + integer + '.' + decimal;
        // () = 1st executed operation thanks to operator precedence
    };

    var nodeListForEach = function (nodeList, callback) {
        // for loop calling the callback function on each iteration
        for (var i = 0; i < nodeList.length; i++) {
            callback(nodeList[i], i);
            // = callback(current, index)
        };
    };


    // Getting HTML input
    // Public method to be used in the controller
    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // Will be income or expense
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            }
        },

        getLimitInput: function () {
            return {
                type: document.querySelector(DOMstrings.limitInputType).value, // percentage or amount
                value: parseFloat(document.querySelector(DOMstrings.limitInputValue).value)
            }
        },

        addListItem: function (object, objectType) {
            var html, newhtml, element;

            // 1. Create an HTML string with a placeholder text (template)
            // placeholder = %% = easier to find + safier to replace
            if (objectType === 'income') {
                // Select the corresponding part of the Interface
                element = DOMstrings.incomeContainer;

                html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (objectType === 'expense') {
                // Select the corresponding part of the Interface
                element = DOMstrings.expensesContainer;

                html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            };

            // 2. Replace the placeholder text with actual data
            newhtml = html.replace('%id%', object.id);
            newhtml = newhtml.replace('%description%', object.description);
            newhtml = newhtml.replace('%value%', formatNumber(object.value, objectType));
            //newhtml = newhtml.replace('%value%', object.value.toFixed(2));
            // console.log('object.value = ' + typeof object.value);

            // 3. Insert HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newhtml);
            // beforeend = insertion of the html as a child of the container and the next one as the last child 

        },

        addLimit: function (limitType, limitValue) {
            // According to the type, change the symbol

            switch (limitType) {
                case 'percentage':
                    // console.log('%');
                    document.querySelector(DOMstrings.limitInputSymbol).textContent = '%';
                    break;

                case 'amount':
                    // console.log('€');
                    document.querySelector(DOMstrings.limitInputSymbol).textContent = '€';
                    break;
            };

            document.querySelector(DOMstrings.budgetLimitValue).textContent = limitValue;

        },

        deleteListItem: function (id) {
            var element = document.getElementById(id);
            element.parentNode.removeChild(element);
            // In JS, to remove an element from the DOM,
            // we can only remove a child
        },

        clearFields: function () {
            var fields, fieldsArray;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            // .querySelectorAll() returns a list

            // Conversion to array to use the .forEach on
            fieldsArray = Array.prototype.slice.call(fields);

            fieldsArray.forEach(function (currentElement, elementIndex, array) {
                //this anonymous callback function can receive up to those 3 params
                currentElement.value = '';
            });

            // Focus back on the description field
            fieldsArray[0].focus();
        },

        clearLimitField: function () {
            var field;

            field = document.querySelector(DOMstrings.limitInputValue);
            field.value = '';
            field.focus();
        },

        displayBudget: function (object) {

            object.budget > 0 ? type = 'income' : type = 'expense';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(object.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(object.totalIncome, 'income');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(object.totalExpense, 'expense');

            if (object.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = object.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            };
        },

        displayPercentages: function (percentages) {

            var fields = document.querySelectorAll(DOMstrings.expencesPercentageLabels);
            // returns a nodeLists (node = HTML element)


            nodeListForEach(fields, function (current, index) {

                // Do stuff
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },

        displayMonth: function () {

            var now, year, month, months;
            now = new Date();
            // var christmas = new Date(2018, 11, 25); // year, month 0 based, day

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth(); // returns the 0 based month number

            year = now.getFullYear();

            document.querySelector(DOMstrings.datelabel).textContent = months[month] + ' ' + year;
        },

        changedType: function () {

            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            );

            nodeListForEach(fields, function (current) {
                current.classList.toggle('red-focus');
            });

            var button = document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        getDOMstrings: function () {
            return DOMstrings;
        }
    };
})();


//------------- Global app controller -------------
var controller = (function (budgetCtrl, UICtrl) {

    // Retrieve the DOMstrings from the UIController = Refactoring
    var DOM = UICtrl.getDOMstrings();

    // Function to set all the event listeners
    // so the structure is clean with every code in functions
    var setupEventListeners = function () {
        // Event listener for the add btn click
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        // Event listener for the Enter keypress
        document.addEventListener('keypress', function (event) { // (event argument)
            if (event.keyCode === 13 || event.which === 13) { // .which for older browsers
                ctrlAddItem();

                // Trigger only if the limitInputField is filled
                var limitInputValueDOM = document.querySelector(DOM.limitInputValue).value;
                if (!limitInputValueDOM.isNaN && limitInputValueDOM > 0) {
                    // console.log(limitInputValueDOM);
                    // Add the limit to the data structure
                    ctrlAddLimit();
                };
            };
        });

        // Event listener for the remove btn click
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        // Event listener for the type drop down menu
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

        // Event listener for the set limit btn
        document.querySelector(DOM.limitInputBtn).addEventListener('click', ctrlAddLimit);

    };

    var updateBudget = function () {

        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the budget to pass it between modules
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function () {

        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. Read percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();

        // 3. Update the UI with the new percentages
        UICtrl.displayPercentages(percentages);

    };

    var updateLimit = function () {

        // 1. Add limit to data structure
        budgetCtrl.addLimit();

        // 2. Retrieve limit
        var limit = UICtrl.getLimitInput;

        // 3. Update UI with the new limit
        UICtrl.addLimit(limit.type, limit.value);
    };

    var ctrlAddItem = function () {
        var input, newItem;

        // 1. Get the field input data
        input = UICtrl.getInput();
        // console.log(input);

        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add item to the UI
            // Formatting for display, directly in the UI controller, so the data for calculation doesn't change
            UICtrl.addListItem(newItem, input.type);
            // object = newItem, obj created with our function constructor
            // type is only stored in the input

            // 4. Clear fields
            UICtrl.clearFields();

            // 5. Calculate and update the budget
            updateBudget();

            // 6. Calculate and update percentages
            updatePercentages();

        };
    };

    var ctrlAddLimit = function () {
        var input, limit;

        // 1. Get limit input from DOM
        input = UICtrl.getLimitInput();
        // console.log('in ctrlAddLimit, input =', input);

        // 2. Add the limit to the budget controller
        if (!input.value.isNaN && input.value > 0) {
            // console.log("I'm about to add the limit to the budget controller");
            limit = budgetCtrl.addLimit(input.type, input.value);
        };

        // 3. Add limit to the UI
        UICtrl.addLimit(limit.type, limit.value);

        // 4. Clear field
        UICtrl.clearLimitField();
    };

    var ctrlDeleteItem = function (event) {
        var itemID, splitID, type, id;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemID) {
            // income-1, expense-2 
            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]);

            // 1. Delete the item from the data structure
            budgetCtrl.deleteItem(type, id);

            // 2. Delete the item from the UI
            UICtrl.deleteListItem(itemID);

            // 3. Update and show the new budget
            updateBudget();

            // 6. Calculate and update percentages
            updatePercentages();
        };

    };

    // Public method
    return {
        init: function () {
            console.log('Application has started.');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalIncome: 0,
                totalExpense: 0,
                percentage: -1,
                limit: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, UIController);

// Only line of code outside any modules
controller.init();
