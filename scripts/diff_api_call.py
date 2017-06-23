#!/usr/bin/python

# Utility script to print the detailed difference between epicor trace and JSON payload
# Usage: diff-api-call.py <epicor-call.xml> <postman-call.json>

import json
import xml.etree.ElementTree
import sys

def parse_xml(file):
    root = xml.etree.ElementTree.parse(file).getroot()
    return dict([(child.tag, child.text) for child in root])

def parse_json(file):
    with open(file, 'r') as f:
        vals = json.load(f)
    for k in vals:
        if type(vals[k]) == bool:
            vals[k] = 'true' if vals[k] else 'false'
        elif type(vals[k]) == int:
            vals[k] = str(vals[k])
        elif vals[k] == '':
            vals[k] = None
    return vals

def print_diff(trace_data, payload_data):
    print("Trace Data: ", len(trace_data), "keys")
    print("Payload Data: ", len(payload_data), "keys")
    diff = [(k, trace_data[k], payload_data[k]) 
            for k in trace_data 
            if k in payload_data and trace_data[k] != payload_data[k]]
    for v in diff:
        print(v)

if __name__ == "__main__":
    trace = parse_xml(sys.argv[1])
    json = parse_json(sys.argv[2])
    print_diff(trace, json)
