document.addEventListener('DOMContentLoaded', () => {
    const additionalWorkTypeSelect = document.getElementById('additionalWorkType');
    const taskCausesContainer = document.getElementById('task-causes-container');
    const taskResultsContainer = document.getElementById('task-results-container');
    const taskDescriptionsContainer = document.getElementById('task-descriptions-container');
    const addTaskCauseButton = document.getElementById('add-task-cause');
    const addTaskResultButton = document.getElementById('add-task-result');
    const addTaskDescriptionButton = document.getElementById('add-task-description');
    const equipmentNameInput = document.getElementById('equipment_name');

    // 필드 추가 함수
    function addField(container, template, button) {
        const fieldContainer = document.createElement('div');
        fieldContainer.classList.add(template.containerClass, 'extra-field');
        fieldContainer.innerHTML = template.innerHTML;
        container.insertBefore(fieldContainer, button);

        // - 버튼에 이벤트 리스너 추가
        fieldContainer.querySelector('.remove-field').addEventListener('click', function() {
            this.parentElement.remove();
        });
    }

    // SET UP ITEM의 값이 변경될 때 이벤트 리스너 추가
    additionalWorkTypeSelect.addEventListener('change', function() {
        const setupItemValue = this.value;
        const taskNameField = document.getElementById('task_name');
        const statusField = document.getElementById('status');
        const firstTaskCauseField = document.querySelector('.task-cause-input');
        const firstTaskResultField = document.querySelector('.task-result-input');
        const firstTaskDescriptionField = document.querySelector('.task-description-input');

        // FAB IN이 선택된 경우
        if (setupItemValue === 'FAB IN') {
            const equipmentName = equipmentNameInput.value;
            taskNameField.value = `${equipmentName} FAB IN`;
            statusField.value = `SET UP으로 인한 ${equipmentName} FAB IN 필요`;
            firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} FAB IN 필요`;
            firstTaskResultField.value = `${equipmentName} FAB IN 완료`;
            firstTaskDescriptionField.value = `ALL MODULE 반입 완료`;

            // 기존의 추가된 필드가 있다면 삭제
            document.querySelectorAll('.extra-field').forEach(field => field.remove());

            // 추가 작업내용 필드 추가
            addField(taskDescriptionsContainer, {
                containerClass: 'task-description-container',
                innerHTML: `
                    <textarea name="task_description" class="task-description-input" required>설비 위치 확인 ( LINE : / BAY : )</textarea>
                    <button type="button" class="remove-field">-</button>
                `
            }, addTaskDescriptionButton);
            addField(taskDescriptionsContainer, {
                containerClass: 'task-description-container',
                innerHTML: `
                    <textarea name="task_description" class="task-description-input" required>Packing List 확인 완료</textarea>
                    <button type="button" class="remove-field">-</button>
                `
            }, addTaskDescriptionButton);
            addField(taskDescriptionsContainer, {
                containerClass: 'task-description-container',
                innerHTML: `
                    <textarea name="task_description" class="task-description-input" required>FENCE 설치 완료</textarea>
                    <button type="button" class="remove-field">-</button>
                `
            }, addTaskDescriptionButton);
            addField(taskDescriptionsContainer, {
                containerClass: 'task-description-container',
                innerHTML: `
                    <textarea name="task_description" class="task-description-input" required>RACK 반입 완료</textarea>
                    <button type="button" class="remove-field">-</button>
                `
            }, addTaskDescriptionButton);
        }
        // INSTALLATION PREPARTION 이 선택된 경우
        else if (setupItemValue === 'INSTALLATION PREPARATION') {
            const equipmentName = equipmentNameInput.value;
            taskNameField.value = `${equipmentName} INSTALLATION PREPARTATION TEMPLATE `;
            statusField.value = `${equipmentName} FAB IN 전 타공 확인`;
            firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} 타공 확인`;
            firstTaskResultField.value = `${equipmentName} 타공 확인 완료`;
            firstTaskDescriptionField.value = `${equipmentName} 타공 확인 완료 ( LINE : / BAY :)`;

            // 기존의 추가된 필드가 있다면 삭제
            document.querySelectorAll('.extra-field').forEach(field => field.remove());

            // 추가 작업내용 필드 추가
            addField(taskDescriptionsContainer, {
                containerClass: 'task-description-container',
                innerHTML: `
                    <textarea name="task_description" class="task-description-input" required>Hole Grating 4, 4, 2, 2 확인</textarea>
                    <button type="button" class="remove-field">-</button>
                `
            }, addTaskDescriptionButton);
            addField(taskDescriptionsContainer, {
                containerClass: 'task-description-container',
                innerHTML: `
                    <textarea name="task_description" class="task-description-input" required>Grating 주위 Template 타공 확인</textarea>
                    <button type="button" class="remove-field">-</button>
                `
            }, addTaskDescriptionButton);
        } 




                // DOCKING 이 선택된 경우
                else if (setupItemValue === 'DOCKING') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} DOCKING(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} DOCKING`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} DOCKING`;
                    firstTaskResultField.value = `${equipmentName} DOCKING 완료`;
                    firstTaskDescriptionField.value = `OHT LINE 확인, LP CENTER 확인 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM 정위치 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required> ALL MODULE DOCKING 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required> EFEM, TM LEVELING 완료 </textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required> ACCESSORY PART, PROTECTION BAR 장착 완료 </textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required> 지진방지 BKT, CTC, Portable RACK 장착 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input"required> ALL PM 내부 HOOK UP 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input"required> EXHAUST PORT 장착 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required> GAS LINE 장착 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }



                                // CABLE HOOK UP 이 선택된 경우
                else if (setupItemValue === 'CABLE HOOK UP') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} CABLE HOOK UP(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} CABLE HOOK UP`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} CABLE HOOK UP`;
                    firstTaskResultField.value = `${equipmentName} CABLE HOOK UP 완료`;
                    firstTaskDescriptionField.value = `ALL PM TM CABLE 포설 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ODT 1s ADJ</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Cable 재단 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>RACK SIGNAL TOWER 설치 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }




                                // PUMP CABLE HOOK UP 이 선택된 경우
                else if (setupItemValue === 'PUMP CABLE HOOK UP') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} PUMP CABLE HOOK UP(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} PUMP CABLE HOOK UP`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} PUMP CABLE HOOK UP`;
                    firstTaskResultField.value = `${equipmentName} PUMP CABLE HOOK UP 완료`;
                    firstTaskDescriptionField.value = `Rack <-> Pump power, signal cable 포설 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Pump단 Cable 주기 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>주변정리 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }



                                // CABLE HOOK UP : SILICON 마감 이 선택된 경우
                else if (setupItemValue === 'CABLE HOOK UP : SILICON') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} SILICON 마감(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} SILICON 마감`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} SILICON 마감 필요`;
                    firstTaskResultField.value = `${equipmentName} SILICON 마감 완료`;
                    firstTaskDescriptionField.value = `Rack 상부 실리콘 마감 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>빛 투과 없음 확인 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Agv 포설 확인 후 Pump hole hole 실리콘 마감 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }


                                                // POWER TURN ON이 선택된 경우
                else if (setupItemValue === 'POWER TURN ON') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} POWER TURN ON(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} POWER TURN ON`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} POWER TURN ON`;
                    firstTaskResultField.value = `${equipmentName} POWER TURN ON 완료`;
                    firstTaskDescriptionField.value = `AC RACK TURN ON 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>설비 Power turn on 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EDA, EFEM PC 원격 연결 확인 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Utility 및 TM FFU 관련 Alarm 제외 Clear 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }


                                                // UTILITY TURN ON이 선택된 경우
                else if (setupItemValue === 'UTILITY TURN ON') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} UTILITY TURN ON(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} UTILITY TURN ON`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} UTILITY TURN ON`;
                    firstTaskResultField.value = `${equipmentName} UTILITY TURN ON 완료`;
                    firstTaskDescriptionField.value = `CDA, VAC Turn on 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PCW Turn ON 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM 유량 ~~ 수준</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Utility turn on sheet 작성 필요</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }


                                                // GAS TURN ON이 선택된 경우
                else if (setupItemValue === 'GAS TURN ON') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} GAS TURN ON(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} GAS TURN ON`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} GAS TURN ON`;
                    firstTaskResultField.value = `${equipmentName} GAS TURN ON 완료`;
                    firstTaskDescriptionField.value = `ALL PM Purge N2 Turn on 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM O2 Turn on 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM N2 Turn on 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }


                                                // LEVELING이 선택된 경우
                else if (setupItemValue === 'LEVELING') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} TEACHING LEVELING(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} TEACHING LEVELING`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} LEVELING`;
                    firstTaskResultField.value = `${equipmentName} LEVELING완료`;
                    firstTaskDescriptionField.value = `ALL PM CHAMBER LEVELING 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TEMP UP 이전 PIN HEIGHT 측정 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM PICK, ARM LEVELING 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TM PICK 장착 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TM 380mm 및 경향성 ADJ 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>BM LEVELING 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TEMP UP 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }

                                                // TEACHING이 선택된 경우
                else if (setupItemValue === 'TEACHING') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} TEACHING(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} TEACHING`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} TEACHING`;
                    firstTaskResultField.value = `${equipmentName} TEACHING 완료`;
                    firstTaskDescriptionField.value = `환경안전 준비사항 확인 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM temp up 후 pin height adj 및 메모장 저장 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM - TM 직교 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM - TM 연결 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>LP teaching 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TM Z축 Teaching 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM Z축 Teaching 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM 미세 Teaching 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM SIGNLE TEACHING 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }

                                                // PART INSTALLATION이 선택된 경우
                else if (setupItemValue === 'PART INSTALLATION') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} PART INSTALLATION(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} PART INSTALLATION`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} PART INSTALLATION`;
                    firstTaskResultField.value = `${equipmentName} PART INSTALLATION 완료`;
                    firstTaskDescriptionField.value = `ALL PM TOP LID CLEAN`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM PROCESS KIT 장착</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PROCESS KIT S/N 메모장 작성 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>장착 후 PUMPING 및 TEMP UP 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }


                                                                // LEAK CHECK이 선택된 경우
                else if (setupItemValue === 'LEAK CHECK') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} LEAK CHECK(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} LEAK CHECK`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} LEAK CHECK`;
                    firstTaskResultField.value = `${equipmentName} LEAK CHECK 완료`;
                    firstTaskDescriptionField.value = `ALL PM LEAK CHECK : SPEC IN`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM O2, N2 GAS LEAK CHECK : SPEC IN</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }
                                                // CUSTOMER CERTIFICATION 중간 인증 준비이 선택된 경우
                else if (setupItemValue === 'CUSTOMER CERTIFICATION 중간 인증 준비') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} CUSTOMER CERTIFICATION 중간 인증 준비(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} 중간 인증 준비`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} 중간 인증 준비`;
                    firstTaskResultField.value = `${equipmentName} 중간 인증 준비 완료`;
                    firstTaskDescriptionField.value = `중간인증 관련 서류 준비 완료`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>RACK 8계통 진행 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM, TM, PM, SUB UNIT 8계통 진행 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>GAS BOX 1, 2 우레탄 시트 부착 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }

                                                // CUSTOMER CERTIFICATION (PIO 장착)이 선택된 경우
                else if (setupItemValue === 'CUSTOMER CERTIFICATION(PIO 장착)') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} CUSTOMER CERTIFICATION(PIO 장착)(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} PIO 장착`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} PIO 장착`;
                    firstTaskResultField.value = `${equipmentName} PIO 장착 완료`;
                    firstTaskDescriptionField.value = `ALL LP PIO SESNSOR 장착`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL LP PIO AUTO/MANUAL 정상 점등 확인</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PIO SENSOR S/N 메모장 작성 완료</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                }

                                                // CUSTOMER CERTIFICATION (사전 중간 인증)이 선택된 경우
                else if (setupItemValue === 'CUSTOMER CERTIFICATION 사전 중간 인증') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} CUSTOMER CERTIFICATION 사전 중간 인증(위험작업, TBM O)`;
                    statusField.value = `${equipmentName} PIO 장착`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} 사전 중간 인증`;
                    firstTaskResultField.value = `${equipmentName} 사전 중간 인증 완료`;
                    firstTaskDescriptionField.value = `Leak Check 정상`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Interlock Check sheet, Gas Box 도면 확인</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Gas Box Open alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Light Curtain alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Protection bar alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM SIDE DOOR alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>LM GUIDE 구동 간 간섭 CHECK</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>MAIN RACK 확인</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>중간 인증 Pass</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                }


                                                              // CUSTOMER CERTIFICATION 중간 인증이 선택된 경우
                else if (setupItemValue === 'CUSTOMER CERTIFICATION 중간 인증') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} CUSTOMER CERTIFICATION 중간 인증(위헙작업, TBM O)`;
                    statusField.value = `${equipmentName} PIO 장착`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} 중간 인증`;
                    firstTaskResultField.value = `${equipmentName} 중간 인증 완료`;
                    firstTaskDescriptionField.value = `Leak Check 정상`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Interlock Check sheet, Gas Box 도면 확인</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Gas Box Open alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Light Curtain alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>Protection bar alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EFEM SIDE DOOR alarm check</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>LM GUIDE 구동 간 간섭 CHECK</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>MAIN RACK 확인</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>중간 인증 Pass</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);

                }

                                              // TTTM이 선택된 경우
                else if (setupItemValue === 'TTTM') {
                    const equipmentName = equipmentNameInput.value;
                    taskNameField.value = `${equipmentName} TTTM`;
                    statusField.value = `${equipmentName} TTTM`;
                    firstTaskCauseField.value = `SET UP으로 인한 ${equipmentName} TTTM`;
                    firstTaskResultField.value = `${equipmentName} TTTM 완료`;
                    firstTaskDescriptionField.value = `설비 사양 작성(O)`;
        
                    // 기존의 추가된 필드가 있다면 삭제
                    document.querySelectorAll('.extra-field').forEach(field => field.remove());
        
                    // 추가 작업내용 필드 추가
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EC MATCHING(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PIRANI CAL(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PIN UP/DOWN TIME ADJ(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM PIN HEIGHT ADJ(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>ALL PM DOOR SPEED ADJ(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PUMPING/VENTING TIME ADJ(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>C/S PIN SPEED ADJ(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>MFC ZERO CAL(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TEMP AUTO TUNE(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>APC AUTO LEARN(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>GAS PRESSURE 35.5 ADJ(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>APC PARTIAL CHECK(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>GAS PARTIAL CHECK(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>GAS PARTIAL CHECK(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>FCIP CAL(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>EPD CAL(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>LEAK CHECK 값 작성(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>PURGE N2 값 확인(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>TTTM SHEET 작성(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);
                    addField(taskDescriptionsContainer, {
                        containerClass: 'task-description-container',
                        innerHTML: `
                            <textarea name="task_description" class="task-description-input" required>LP MARGIN CHECK(O)</textarea>
                            <button type="button" class="remove-field">-</button>
                        `
                    }, addTaskDescriptionButton);



                }


                else {
            // 다른 선택 항목이 선택된 경우 추가된 필드 제거
            document.querySelectorAll('.extra-field').forEach(field => field.remove());
        }

        
    });
});
