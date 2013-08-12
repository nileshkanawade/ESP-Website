// helper to update observables of model with values from data if present
var simpleFromJS = function (data, model) {
    for (var key in data) {
        if (ko.isWriteableObservable(model[key])) {
            model[key](data[key]);
        }
    }
};

// ClassSubject model constructor
var ClassSubject = function (data, vm) {
    var self = this;
    self.emailcode   = ko.observable("");
    self.title       = ko.observable("");
    self.teacher_ids = ko.observableArray();
    self.class_info  = ko.observable("Loading class description...");
    self.grade_min   = ko.observable(-Infinity);
    self.grade_max   = ko.observable(Infinity);
    self.grade_range = ko.observable("Loading...");
    self.difficulty  = ko.observable("Loading...");
    self.prereqs     = ko.observable("Loading...");
    self.section_ids = ko.observableArray();

    // teacher objs for the teacher ids
    self.teachers = ko.computed(function () {
        var teachersIndex = vm.teachers();
        return ko.utils.arrayMap(self.teacher_ids(), function (teacher_id) {
            return teachersIndex[teacher_id];
        });
    });

    // TODO: make a Sections model and a sections index and fill this in
    self.sections = ko.computed(function () {
        return [];
    });

    // rename attributes: teachers -> teacher_ids, sections -> section_ids
    data.teacher_ids = data.teachers;
    data.section_ids = data.sections;
    delete data.teachers;
    delete data.sections;

    // update model from data
    simpleFromJS(data, self);

    // get detailed class info
    // temporary hack until class_subjects view can return this info
    var id = data.id;
    json_fetch(["class_info?class_id=" + id], function (data) {
        data = data.classes[id];
        data.section_ids = data.sections;
        delete data.sections;
        simpleFromJS(data, self);
    });
};

// Teacher model constructor
var Teacher = function (data, vm) {
    var self = this;
    self.first_name = ko.observable();
    self.last_name  = ko.observable();

    self.name = ko.computed(function () {
        return self.first_name() + " " + self.last_name();
    });

    simpleFromJS(data, self);
};

// Catalog view model constructor
var CatalogViewModel = function () {
    var self = this;
    self.classes = ko.observable({});
    self.sections = ko.observable({});
    self.teachers = ko.observable({});
    self.classesArray = ko.computed(function () {
        var ret = [];
        var classes = self.classes();
        for (var key in classes) {
            ret.push(classes[key]);
        }
        return ret;
    });
    json_fetch(['class_subjects'], function (data) {
        // update classes
        for (var key in data.classes) {
            data.classes[key] = new ClassSubject(data.classes[key], self);
        }
        self.classes(data.classes);
        // update teachers
        for (var key in data.teachers) {
            data.teachers[key] = new Teacher(data.teachers[key], self);
        }
        self.teachers(data.teachers);
    });
};

$j(function () {
    var vm = new CatalogViewModel();
    ko.applyBindings(vm);
});
