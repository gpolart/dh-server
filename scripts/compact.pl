#!/usr/bin/perl

use strict;

my $average = 300000;
my $line;
my $last_sent;
my $buffer = [];
while ($line = <STDIN>) {
	chomp $line;
	my @items = split(":", $line);

	if (!defined($last_sent)) {
        $last_sent = $items[0];
        push @$buffer, $items[1];
	}
	else {
        my $diff = $items[0] - $last_sent;
        if ($diff < $average) {
            push @$buffer, $items[1];
        }
        else {
            my $sum = 0;
            my $count = 0;
            foreach my $val (@$buffer) {
                $sum = $sum + 1.0*$val;
                $count++;
            }
            if ($count > 0) {
                $sum = $sum / $count;
                print "$items[0]:$sum\n";
                $last_sent = $items[0];
                $buffer = [];
            }
        }
	}
}
