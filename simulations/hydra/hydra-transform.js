function(definitions, model) {
    var templateDataModel = { data: {}, valid: true , errors: []},
        viewInstance = null,
        count = 0,
        list = null;

    function exctractValue(attrName, id, view) {
        return definitions.extractEnumValues(attrName, id, view, model.external);
    }

    function flattenArray(array) {
        var result = [],
            count = array.length;

        while(count--) {
            result = result.concat(array[count]);
        }

        return result;
    }

    // === Title + comment  section (3.1) ====
    templateDataModel.data.title = model.name;

    // === Load balancing section (3.2) ====

    try {
        viewInstance = model.data.execution[0];
        templateDataModel.data.load_balance = {
            method      : exctractValue('LoadBalance', 'loadbalance.method',     viewInstance),
            diagnostics : exctractValue('LoadBalance', 'loadbalance.diagnostics', viewInstance)
        };
    } catch(error) {
        templateDataModel.errors.push("Load balancing not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    // === Load curve section (3.3) ====
    // TODO / FIXME

    // === Materials section (3.4) ====
    try {
        templateDataModel.data.materials = [];
        list = model.data.material;
        count = list.length;
        while(count--) {
            templateDataModel.data.materials.push({
                rho      : list[count].Material['material.rho'],
                cp       : list[count].Material['material.cp'],
                cv       : list[count].Material['material.cv'],
                k        : list[count].Material['material.k'],
                mu       : list[count].Material['material.mu'],
                tref     : list[count].Material['material.tref'],
                // FIXME MISSING GAMMA
                beta     : list[count].Material['material.beta'],
                rigid    : exctractValue('Material', 'material.rigid', list[count]),
                vel      : list[count].Material['material.vel'],
                blockids : flattenArray(exctractValue('Material', 'block.tags', list[count])),
                type     : exctractValue('Material', 'material.type', list[count]),
                name     : list[count].name
            });
        }
    } catch(error) {
        templateDataModel.errors.push("Material section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    // === Execution control section (3.5) ===
    try {
        templateDataModel.data.exe_control = {
            nstep : model.data.execution[0].ExecutionControl['executioncontrol.nstep']
        };
    } catch(error) {
        templateDataModel.errors.push("Execution control section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    // === Output section (3.6) ===
    try {
        viewInstance = model.data.output[0];
        templateDataModel.data.output = {
            dump       : model.data.output[0].Output['dump.ndump'],
            plti       : model.data.output[0].Output['plot.nplot'],
            prtlev     : exctractValue('Output', 'ascii.prtlev', viewInstance),
            prti       : model.data.output[0].Output['ascii.prti'], // Only if previous is Verbose
            thti       : model.data.output[0].Output['timehistory.nstep'],
            ttyi       : model.data.output[0].Output['velocityminmax.nstep'],
            pltype     : exctractValue('Plot', 'plot.pltype', viewInstance),
            filetype   : exctractValue('Plot', 'plot.filetype', viewInstance),
            histvar    : { TimeHistoryElem: [], TimeHistoryNode: [], TimeHistorySide: [] },
            plotvar    : { 
                elem: exctractValue('Plot', 'plot.evariables', viewInstance),
                node: exctractValue('Plot', 'plot.nvariables', viewInstance),
                side: []
            }
        };
    } catch(error) {
        templateDataModel.errors.push("Output section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    // === histvar section (3.6.3) ===
    try {
        list = model.data.histvar;
        count = list ? list.length : 0;
        while(count--) {
            var activeAttr = definitions.extractOrSelection(list[count])[0];
            
            templateDataModel.data.output.histvar[activeAttr].push({
                ids: flattenArray(exctractValue(activeAttr, 'timehistory.tags', list[count])),
                vars: [].concat(exctractValue(activeAttr, 'timehistory.variables', list[count]))
            });
        }
    } catch(error) {
        templateDataModel.errors.push("Time History (histvar) section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    // === plotvar section (3.6.4) ===
    if(model.data.plotvar) { // Maybe no side plot
        try {
            list = model.data.plotvar;
            count = list.length;
            while(count--) {
                console.log('++++++++++++++');
                console.log(list[count].PlotSide);
                console.log('++++++++++++++');
                templateDataModel.data.output.plotvar.side.push({
                    ids:  exctractValue('PlotSide', 'face.tags',       list[count]),
                    vars: exctractValue('PlotSide', 'plot.svariables', list[count])
                });
            }
        } catch(error) {
            templateDataModel.errors.push("Plot Variable (plotvar) section not valid");
            templateDataModel.errors.push("=> " + error.message);
            templateDataModel.valid = false;
    }
    }

    // === Time Step and Time Integration section (3.7 + 4.11) ====

    try {
        templateDataModel.data.time = {
            nsteps  : model.data.time[0].Time['time.nstep'],
            deltat  : model.data.time[0].Time['time.deltat'],
            term    : model.data.time[0].Time['time.term'],
            type    : exctractValue('TimeIntegration', 'timeintegration.type', model.data.time[0]),
            CFLinit : model.data.time[0].TimeIntegration['timeintegration.CFLinit'],
            CFLmax  : model.data.time[0].TimeIntegration['timeintegration.CFLmax'],
            dtmax   : model.data.time[0].TimeIntegration['timeintegration.dtmax'],
            dtscale : model.data.time[0].TimeIntegration['timeintegration.dtscale'],
            thetaa  : model.data.time[0].TimeIntegration['timeintegration.thetaA'],
            thetak  : model.data.time[0].TimeIntegration['timeintegration.thetaK'],
            thetaf  : model.data.time[0].TimeIntegration['timeintegration.thetaF']
        };
    } catch(error) {
        templateDataModel.errors.push("Time Step and Time integration section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== Turbulence Statistics section (3.8) ====

    try {
        templateDataModel.data.plotstatvar = {
            elem         : exctractValue('TurbulenceStatistics', 'turbulencestatistics.evariables', model.data.output[0]),
            node         : exctractValue('TurbulenceStatistics', 'turbulencestatistics.nvariables', model.data.output[0]),
            side         : [],
            starttime    : model.data.output[0].TurbulenceStatistics['turbulencestatistics.starttime'],
            endtime      : model.data.output[0].TurbulenceStatistics['turbulencestatistics.endtime'],
            plotwinsize  : model.data.output[0].TurbulenceStatistics['turbulencestatistics.plotwinsize']
        };

        if(model.data.plotstatvar) {
            list = model.data.plotstatvar;
            count = list.length;
            while(count--) {
                templateDataModel.data.plotstatvar.side.push({
                    ids:  exctractValue('TurbulenceStatisticsSide', 'face.tags', list[count]),
                    vars: exctractValue('TurbulenceStatisticsSide', 'turbulencestatistics.svariables', list[count])
                });
            }
        }
    } catch(error) {
        templateDataModel.errors.push("Turbulence Statistics section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }


    //- ==== Cell-centered incompressible Navier-Stokes section (4) ====


    //- ==== Energy section (4.2) ====

    try {
        templateDataModel.data.energy = {
            form : exctractValue('Energy', 'energy.form', model.data.solvers[0])
        };
    } catch(error) {
        templateDataModel.errors.push("Energy section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== Hydrostat section (4.3) ====

    try {
        templateDataModel.data.hstat = [
            // { ids: [1,4,7,9],   curveId: 1, amplitude: 5.2354 },  // Fake data to test output
            // { ids: [2,3,5,6,8], curveId: 2, amplitude: 0.9235 }   // Fake data to test output
        ];
    } catch(error) {
        templateDataModel.errors.push("Hydrostat section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }
    // FIXME add nodeset => { ids: [], curveId: 34, amplitude: 2.567 }

    //- ==== Initial conditions section (4.4) ====

    try {
        templateDataModel.data.initial = {
            vel          : model.data.initial[0].Initial['initial.vel'],
            tke          : model.data.initial[0].Initial['initial.tke'],
            eps          : model.data.initial[0].Initial['initial.eps'],
            omega        : model.data.initial[0].Initial['initial.omega'],
            turbnu       : model.data.initial[0].Initial['initial.turbnu'],
            temperature  : model.data.initial[0].Initial['initial.temperature'],
            enthalpy     : model.data.initial[0].Initial['initial.enthalpy'],
            init_energy  : model.data.initial[0].Initial['initial.init_energy']
        };
    } catch(error) {
        templateDataModel.errors.push("Initial conditions section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== Forces section (4.5) ====

    try {
        templateDataModel.data.forces = {
            body_force: [
                // { force: [ 1.2, 0.2, 5.6], curveId: 34, id: 1, comment: "fake data"},     // Fake data to test output
                // { force: [12.3, 0.2, 5.6], curveId: 34, comment: "fake data" },           // Fake data to test output
                // { force: [23.4, 0.2, 5.6], comment: "fake data" }                         // Fake data to test output
            ],
            boussinesqforce: [
                // { gravity: [ 1.2, 0.2, 5.6], curveId: 33, id: 2, comment: "fake data"},   // Fake data to test output
                // { gravity: [12.3, 0.2, 5.6], curveId: 33, comment: "fake data" },         // Fake data to test output
                // { gravity: [23.4, 0.2, 5.6], comment: "fake data" }                       // Fake data to test output
            ],
            porous_drag: [
                // { amplitude: 1.23, curveId: 33, id: 2, comment: "fake data"},             // Fake data to test output
                // { amplitude: 2.34, curveId: 33, comment: "fake data" },                   // Fake data to test output
                // { amplitude: 3.45, comment: "fake data" }                                 // Fake data to test output
            ]
        };
        // FIXME: Manage OR on "forces" view [ BodyForce, BoussinesqForce, PorousDragForce ].
    } catch(error) {
        templateDataModel.errors.push("Forces section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }


    //- ==== Boundary Conditions section (4.6) ====

    try {
        templateDataModel.data.boundary_conditions = {
             //  inside a group { ids: [2], curveId: -1, amplitude: 3.665, comment: "fake data"}
        };
        // FIXME: Manage OR on "boundary" view 
        // [ "ScalarDirichlet", "VelocityDirichlet", "SymmetryVelocity", 
        //   "HeatFlux", "PassiveOutflow", "PressureOutflow", "User-DefinedVelocity" ].
        list = model.data.boundary;
        count = list ? list.length : 0;
        while(count--) {
            var activeAttr = definitions.extractOrSelection(list[count])[0];

            if(["ScalarDirichlet", "VelocityDirichlet", "SymmetryVelocity", "HeatFlux"].indexOf(activeAttr) !== -1) {
                var groupName = definitions.definition.definitions[activeAttr].value;

                if(groupName === undefined) {
                    groupName = exctractValue(activeAttr, 'scalar', list[count]);
                }

                if(templateDataModel.data.boundary_conditions[groupName] === undefined) {
                    templateDataModel.data.boundary_conditions[groupName] = [];
                }

                templateDataModel.data.boundary_conditions[groupName].push({
                    comment: list[count].name,
                    ids: flattenArray(exctractValue(activeAttr, 'face.tags', list[count])),
                    curveId: list[count][activeAttr]['name'],
                    amplitude: list[count][activeAttr]['amplitude']
                });

            } else if(["PassiveOutflow", "PressureOutflow", "User-DefinedVelocity"].indexOf(activeAttr) !== -1) {
                var groupName = definitions.definition.definitions[activeAttr].value;

                if(templateDataModel.data.boundary_conditions[groupName] === undefined) {
                    templateDataModel.data.boundary_conditions[groupName] = [];
                }

                templateDataModel.data.boundary_conditions[groupName].push({
                    comment: list[count].name,
                    ids: flattenArray(exctractValue(activeAttr, 'face.tags', list[count]))
                });
            }
        }

        // Add heatflux too
    } catch(error) {
        templateDataModel.errors.push("Boundary Conditions section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== User-defined Velocity boundary conditions section (4.7)
    //- NOT SUPPORTED YET

    //- ==== Heat sources section (4.8) ===

    try {
        templateDataModel.data.heat_sources = [
            // { amplitude: 1.23, curveId: 33, id: 2, comment: "fake data"},             // Fake data to test output
            // { amplitude: 2.34, curveId: 33, comment: "fake data" },                   // Fake data to test output
            // { amplitude: 3.45, comment: "fake data" }                                 // Fake data to test output
        ];
        // FIXME
    } catch(error) {
        templateDataModel.errors.push("Heat sources section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== Pressure, Momentum and Transport Solvers section (4.9) ===

    try {
        templateDataModel.data.ppesolver = {
            trunc_factor        : model.data.solvers[0].HypreBoomerAMG['hypreboomeramg.trunc_factor'],
            pmax_elements       : model.data.solvers[0].HypreBoomerAMG['hypreboomeramg.pmax_elements'],
            agg_num_levels      : model.data.solvers[0].HypreBoomerAMG['hypreboomeramg.agg_num_levels'],
            agg_num_paths       : model.data.solvers[0].HypreBoomerAMG['hypreboomeramg.agg_num_paths'],
            strong_threshold    : model.data.solvers[0].HypreBoomerAMG['hypreboomeramg.strong_threshold'],
            max_rowsum          : model.data.solvers[0].HypreBoomerAMG['hypreboomeramg.max_rowsum'],
            smoother            : exctractValue('MLAMG', 'mlamg.smoother', model.data.solvers[0]),
            pre_smooth          : model.data.solvers[0].Pressure['pressuresolver.pre_smooth'],
            post_smooth         : model.data.solvers[0].Pressure['pressuresolver.post_smooth'],
            levels              : model.data.solvers[0].Pressure['pressuresolver.levels'],
            itmax               : model.data.solvers[0].Pressure['pressuresolver.itmax'],
            itchk               : model.data.solvers[0].Pressure['pressuresolver.itchk'],
            eps                 : model.data.solvers[0].Pressure['pressuresolver.eps'],
            zeropivot           : model.data.solvers[0].Pressure['pressuresolver.pivot'],

            type                : exctractValue( 'Pressure', 'pressuresolver.type',                     model.data.solvers[0]),
            amgpc               : exctractValue( 'Pressure', 'pressuresolver.amgpc',                    model.data.solvers[0]),
            hypre_type          : exctractValue( 'Pressure', 'pressuresolver.hypre_type',               model.data.solvers[0]),
            diagnostics         : exctractValue( 'Pressure', 'pressuresolver.diagnostics',              model.data.solvers[0]),
            convergence         : exctractValue( 'Pressure', 'pressuresolver.convergence',              model.data.solvers[0]),
            cycle               : exctractValue( 'Pressure', 'pressuresolver.cycle',                    model.data.solvers[0]),
            solver              : exctractValue( 'Pressure', 'pressuresolver.solver',                   model.data.solvers[0]),
            hypre_coarsen_type  : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.hypre_coarsen_type', model.data.solvers[0]),
            hypre_smoother      : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.hypre_smoother',     model.data.solvers[0]),
            hypre_smoother_dn   : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.hypre_smoother_dn',  model.data.solvers[0]),
            hypre_smoother_up   : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.hypre_smoother_up',  model.data.solvers[0]),
            hypre_smoother_co   : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.hypre_smoother_co',  model.data.solvers[0]),
            interp_type         : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.interp_type',        model.data.solvers[0]),
            hypre_nodal         : exctractValue( 'HypreBoomerAMG', 'hypreboomeramg.hypre_nodal',        model.data.solvers[0])
        };
    
        templateDataModel.data.momentumsolver = {
            restart       : model.data.solvers[0].Momentum['momentumsolver.restart'],
            itmax         : model.data.solvers[0].Momentum['momentumsolver.itmax'],
            itchk         : model.data.solvers[0].Momentum['momentumsolver.itchk'],
            eps           : model.data.solvers[0].Momentum['momentumsolver.eps'],

            type          : exctractValue('Momentum', 'momentumsolver.type',        model.data.solvers[0]),
            diagnostics   : exctractValue('Momentum', 'momentumsolver.diagnostics', model.data.solvers[0]),
            convergence   : exctractValue('Momentum', 'momentumsolver.convergence', model.data.solvers[0])
        };
    
        templateDataModel.data.transportsolver = {
            restart       : model.data.solvers[0].TransportSolver['transportsolver.restart'],
            itmax         : model.data.solvers[0].TransportSolver['transportsolver.itmax'],
            itchk         : model.data.solvers[0].TransportSolver['transportsolver.itchk'],
            eps           : model.data.solvers[0].TransportSolver['transportsolver.eps'],

            type          : exctractValue('TransportSolver', 'transportsolver.type',        model.data.solvers[0]),
            diagnostics   : exctractValue('TransportSolver', 'transportsolver.diagnostics', model.data.solvers[0]),
            convergence   : exctractValue('TransportSolver', 'transportsolver.convergence', model.data.solvers[0])
        };
    } catch(error) {
        templateDataModel.errors.push("Pressure, Momentum and Transport Solvers section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== solution_method section (4.10) ====

    try {
        templateDataModel.data.solution = {
            itmax            : model.data.solution[0].SolutionMethod['solutionmethod.nitmax'],
            nvec             : model.data.solution[0].SolutionMethod['solutionmethod.nvec'],
            eps              : model.data.solution[0].SolutionMethod['solutionmethod.eps'],
            eps_dist         : model.data.solution[0].SolutionMethod['solutionmethod.eps_dist'],
            eps_p0           : model.data.solution[0].SolutionMethod['solutionmethod.eps_p0'],
            drop_tol         : model.data.solution[0].SolutionMethod['solutionmethod.drop_tol'],

            strategy         : exctractValue('SolutionMethod', 'solutionmethod.strategy',         model.data.solution[0]),
            error_norm       : exctractValue('SolutionMethod', 'solutionmethod.error_norm',       model.data.solution[0]),
            timestep_control : exctractValue('SolutionMethod', 'solutionmethod.timestep_control', model.data.solution[0]),
            convergence      : exctractValue('SolutionMethod', 'solutionmethod.convergence',      model.data.solution[0]),
            subcycle         : exctractValue('SolutionMethod', 'solutionmethod.subcycle',         model.data.solution[0]),
            diagnostics      : exctractValue('SolutionMethod', 'solutionmethod.diagnostics',      model.data.solution[0])
        };
    } catch(error) {
        templateDataModel.errors.push("Solution method section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    //- ==== time_integration section (4.11) ====

    // Extracted previously in Time (3.7)

    //- ==== Turbulence models section (4.12) ====

    try {
        var modelType = definitions.extractOrSelection(model.data.turbulence[0])[0];

        templateDataModel.data.turbulence = {
            model             : definitions.definition.definitions[modelType].value,
            timescale_limiter : exctractValue('RNG_ke', 'rgn_ke.timescale_limiter', model.data.turbulence[0]),
            c_s               : model.data.turbulence[0].Smagorinsky['smagorinsky.c_s'],
            prandtl_s         : model.data.turbulence[0].Smagorinsky['smagorinsky.prandtl'],
            schmidt_s         : model.data.turbulence[0].Smagorinsky['smagorinsky.schmidt'],
            c_w               : model.data.turbulence[0].WALE['wale.c_w'],
            prandtl_w         : model.data.turbulence[0].WALE['wale.prandtl'],
            schmidt_w         : model.data.turbulence[0].WALE['wale.schmidt']
        };
    } catch(error) {
        templateDataModel.errors.push("Turbulence models section not valid");
        templateDataModel.errors.push("=> " + error.message);
        templateDataModel.valid = false;
    }

    console.log(model);
    console.log(templateDataModel);

    return templateDataModel;
}
